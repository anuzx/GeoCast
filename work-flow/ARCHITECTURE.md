# Weather Anomaly Tracking & Downscaling Platform — Architecture

**Status:** v0.1 draft — architecture for a working prototype
**Core stack:** Turborepo · TypeScript · Python · PyTorch
**Model core:** SET-D — Spherical Ensemble Transformer-Diffusion (Stage 1 GNN tracker + Stage 2 conditional diffusion downscaler), as scoped in the earlier design discussion

This document specifies how to actually build the two-stage extreme-weather tracking and downscaling system as a single monorepo: what goes where, how the pieces talk to each other, what the data model looks like, and in what order to build it so there's always something runnable.

## Table of Contents

1. Overview
2. Scope of This Prototype
3. Guiding Principles
4. Tech Stack
5. Monorepo Structure (Turborepo)
6. High-Level System Architecture
7. Deployment & Component Architecture
8. ML Pipeline Architecture
9. Data Architecture
10. Service Architecture & API Contracts
11. Sequence Diagrams
12. Local Development
13. Deployment & CI/CD
14. Phased Build Roadmap
15. Evaluation & Validation Plan
16. Risks & Open Questions
17. Appendix

---

## 1. Overview

**Problem.** Extreme weather anomalies (cyclones, heat domes, cold waves, extreme rainfall) have to be found and tracked inside massive 4D global ensemble NWP output by hand. Standard CNN/U-Net models smooth away the amplitude peaks that actually matter for a warning system, and there's a large gap between coarse 12 km global ensembles and the 5 km localized impact zones that first responders and farmers need.

**Solution.** A two-stage pipeline:

- **Stage 1 — Tracker:** map NWP fields onto a spherical icosahedral mesh, run a graph neural network over it to score and segment extreme anomalies against a 30-year climatological baseline, then track them across the 3–10 day forecast window.
- **Stage 2 — Downscaler:** crop the tracked event region and run a physics-constrained conditional diffusion model that generates a probabilistically sound 5 km field without flattening the extremes, conditioned on the Stage 1 event embedding and topography via cross-attention.

The output feeds a REST/WebSocket API, a map-based dashboard, and a tiered (low/moderate/severe) alerting system.

**What this document adds** on top of the earlier architecture discussion is the actual engineering plan: a Turborepo monorepo that houses the TypeScript web/API layer and the Python/PyTorch ML layer side by side, a concrete data model, service boundaries, API contracts, local dev setup, CI/CD, and a phased build order that produces a demo-able system at every phase instead of one big-bang integration at the end.

## 2. Scope of This Prototype

**In scope for v1:**
- End-to-end pipeline on historical/replay data (ERA5, IMDAA, archived NEPS-G/NCUM runs) for a handful of documented events (e.g. Cyclone Amphan, a North India heatwave window)
- Non-ML baseline tracker (EFI-style anomaly score) *and* the GNN tracker, swappable behind one interface
- Deterministic U-Net downscaler *and* the conditional diffusion downscaler, swappable behind one interface
- A basic physics-informed loss (moisture, thermodynamic, spectral terms) — not a full PDE solver
- A working dashboard, forecast/events API, and threshold-based alerting
- Single-GPU training and inference; Docker Compose deployment

**Explicitly out of scope for v1** (candidates for v2+):
- Training a GraphCast/GenCast/Pangu-scale global foundation model from scratch
- Full ensemble diffusion forecasting (GenCast-style) at the global scale — Stage 1 stays deterministic-per-member with an ensemble *summary*, not a full generative global ensemble
- Multi-region / multi-tenant deployment, billing, SSO
- Kubernetes in production — the prototype targets a single GPU box; Section 13 describes the scaling path
- Mobile apps (the dashboard is a responsive web app only)

## 3. Guiding Principles

- **Prove it without ML first.** Each stage ships a cheap statistical/deterministic baseline before its ML counterpart is trained against it (see [Section 14](#14-phased-build-roadmap)). This mirrors the phased approach discussed earlier and keeps the project demo-able at every step.
- **Stable interfaces between stages.** Stage 1 and Stage 2 exchange plain dataclasses/Pydantic models ([Section 8.5](#85-stage-interfaces)), so swapping baseline → GNN or U-Net → diffusion never touches the serving layer.
- **One command boots the stack.** `turbo dev` starts the dashboard, gateway, and ML service together; `turbo build test lint` runs the same checks across TypeScript *and* Python.
- **Outputs are probabilistic, not exact.** Every number surfaced in the UI traces back to a stored `model_run` row and an evaluation report — no unlabeled point estimates.
- **Dev mirrors prod.** The Docker Compose stack used locally is the same shape as the deployed stack, just smaller.

## 4. Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Monorepo orchestration | **Turborepo** 2.x + pnpm workspaces | Task graph & caching across TS *and* Python (see Section 5.2) |
| Frontend | **Next.js** (App Router) + TypeScript + Tailwind CSS | Dashboard UI |
| Frontend data layer | tRPC client + TanStack Query | Type-safe calls into the API gateway |
| Geospatial UI | MapLibre GL JS + deck.gl | Map, event polygons/trajectories, 5 km raster overlays |
| API gateway | Node.js + Fastify + tRPC + Zod | Auth, caching, aggregation, WebSocket push, thin proxy to the ML service |
| Realtime | Fastify WebSocket plugin | Pushing new alerts to connected dashboards |
| ML service | **Python** 3.12+ + FastAPI + Uvicorn + Pydantic v2 | Inference API, model registry access |
| Async jobs | Celery + Redis broker + Celery Beat | Scheduled ingestion, batch inference |
| ML framework | **PyTorch** 2.x | GNN tracker + diffusion downscaler |
| Graph learning | PyTorch Geometric (PyG) | Icosahedral mesh message passing |
| Diffusion | Hugging Face Diffusers (`UNet2DConditionModel` + schedulers) | Conditional 12 km → 5 km downscaling |
| Data engineering | Xarray + Dask + Zarr + fsspec/s3fs | Parallel processing of 4D NetCDF/GRIB2 arrays |
| Meteorology | MetPy | Derived variables, physical-consistency checks |
| Geospatial (Python) | Cartopy + GeoPandas + Shapely | Projections, geometry ops for events |
| Experiment tracking | MLflow | Runs, metrics, model registry (staging/production stages) |
| Metadata store | PostgreSQL 16+ with PostGIS | Events, trajectories, alerts, model runs |
| Cache / queue / pub-sub | Redis (or Valkey, if AGPL licensing is a concern) | Forecast cache, Celery broker, alert fan-out |
| Object storage | MinIO (dev) / S3 (prod) | Zarr arrays, checkpoints, MLflow artifacts |
| Python workspace mgmt | **uv** | Dependency resolution + workspace across `ml-core`/`ml-service` |
| Containerization | Docker + Docker Compose | Local dev parity with prod |
| CI | GitHub Actions + Turborepo remote cache | Affected-package builds/tests only |
| GPU | NVIDIA CUDA 12.x | Training + inference |
| Testing | Vitest (TS), pytest (Python), Playwright (e2e, optional) | Unit / integration / e2e |
| Lint / format | ESLint + Prettier (TS), Ruff + mypy (Python) | Consistency, type safety |

PyTorch was chosen over JAX per the stack requirement and because the PyG + Diffusers ecosystem is the path of least resistance for a GNN-plus-diffusion pipeline built by one team on one timeline.

## 5. Monorepo Structure (Turborepo)

### 5.1 Folder layout

```
weather-anomaly-platform/
├── apps/
│   ├── web/                       # Next.js dashboard (TypeScript)
│   ├── api/                       # Fastify + tRPC gateway (TypeScript)
│   └── ml-service/                # FastAPI inference + Celery workers (Python)
│       ├── app/
│       │   ├── main.py
│       │   ├── routers/           # forecast.py, events.py, health.py
│       │   ├── services/          # inference_service.py, model_registry.py
│       │   ├── workers/           # celery_app.py, tasks.py
│       │   └── schemas.py
│       ├── tests/
│       ├── pyproject.toml
│       └── package.json           # turbo-facing script wrapper, see 5.2
├── packages/
│   ├── ui/                        # shared React components (TypeScript)
│   ├── schemas/                   # Zod schemas shared by web <-> api (tRPC contracts)
│   ├── config-ts/                 # shared eslint / tsconfig / tailwind config
│   └── ml-core/                   # core ML library (Python)
│       ├── ml_core/
│       │   ├── data/              # NWP fetchers, xarray/dask preprocessing, zarr I/O
│       │   ├── mesh/              # icosahedral mesh construction & regridding
│       │   ├── tracker/           # Stage 1: efi_baseline.py, gnn_model.py, temporal.py, event_extraction.py
│       │   ├── downscaler/        # Stage 2: unet_baseline.py, diffusion_model.py, conditioning.py
│       │   ├── physics/           # loss terms: moisture, thermodynamic, spectral, extreme-weighted
│       │   ├── training/          # train_tracker.py, train_downscaler.py, config/*.yaml
│       │   └── inference/         # pipeline.py — orchestrates Stage 1 -> Stage 2 for serving
│       ├── tests/
│       ├── pyproject.toml
│       └── package.json
├── infra/
│   ├── docker/                    # one Dockerfile per app
│   ├── docker-compose.yml
│   └── k8s/                       # future scale-out path, empty in v1
├── scripts/                       # one-off training/eval/backfill entry points, notebooks
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── pyproject.toml                 # uv workspace root
└── uv.lock
```

### 5.2 Making Python a first-class Turborepo citizen

Turborepo's task graph is built from workspace `package.json` files; it doesn't care what language a script actually runs. There are two ways to wire Python in, and the prototype should start with the first:

**Approach A — package.json script wrapper (recommended default).** Every Python workspace (`apps/ml-service`, `packages/ml-core`) gets a minimal `package.json` whose scripts shell out to `uv run`. Turborepo then treats it exactly like any TS workspace for caching, parallelism, and `--filter`.

```json
// apps/ml-service/package.json
{
  "name": "ml-service",
  "private": true,
  "scripts": {
    "dev": "uv run uvicorn app.main:app --reload --port 8001",
    "build": "uv sync --frozen",
    "test": "uv run pytest",
    "lint": "uv run ruff check .",
    "typecheck": "uv run mypy app"
  }
}
```

This is the approach documented in Turborepo's multi-language guide and it works on any recent Turborepo version with no feature flags.

**Approach B — native `uv` workspace discovery (optional, still experimental as of this writing).** Turborepo can also discover the members of a `uv` workspace directly, without a `package.json` per Python package, via `futureFlags.experimentalPythonWorkspaces`:

```json
// turbo.json (excerpt)
{
  "$schema": "https://turborepo.dev/schema.json",
  "futureFlags": { "experimentalPythonWorkspaces": true },
  "tasks": {}
}
```

```toml
# pyproject.toml (root) — required for Approach B
[tool.turbo]
name = "weather-platform-python"

[tool.uv.workspace]
members = ["packages/ml-core", "apps/ml-service"]
```

This removes the shim but is explicitly flagged experimental by Turborepo (pin the exact `turbo` version everywhere it runs, including CI, since older versions reject the future flag). **Recommendation:** build the prototype on Approach A for stability, keep the root `pyproject.toml` workspace table in place regardless (uv needs it either way to share one lockfile/venv across `ml-core` and `ml-service`), and revisit Approach B once it graduates from experimental.

### 5.3 turbo.json

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

`turbo dev` therefore boots `apps/web`, `apps/api`, and `apps/ml-service` concurrently; `turbo test` runs Vitest and pytest across every workspace that has one; `turbo build --filter=...[origin/main]` in CI only rebuilds what a PR actually touched.

### 5.4 Root package.json (excerpt)

```json
{
  "name": "weather-anomaly-platform",
  "private": true,
  "packageManager": "pnpm@9",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": { "turbo": "^2.10.0" }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

## 6. High-Level System Architecture

```mermaid
flowchart TD
    subgraph SRC["Data Sources"]
        A1["NEPS-G Ensemble 12km"]
        A2["NCUM Deterministic 12km"]
        A3["ERA5 / IMDAA Reanalysis"]
    end

    subgraph ING["Ingestion & Preprocessing"]
        B1["GRIB2 / NetCDF Fetchers"]
        B2["Xarray + Dask"]
        B3["Zarr Writer"]
    end

    subgraph MESH["Spherical Mesh"]
        C1["Lat/Lon to Icosahedral Mesh"]
    end

    subgraph S1["Stage 1: Event Tracker"]
        D1["EFI Baseline Scorer"]
        D2["GNN Message Passing"]
        D3["Temporal Attention"]
        D4["Event Segmentation & Tracking"]
    end

    subgraph S2["Stage 2: Downscaler"]
        E1["U-Net Baseline"]
        E2["Conditional Diffusion"]
        E3["Physics-Informed Validation"]
    end

    subgraph SERVE["Serving Layer"]
        F1["Forecast Endpoint"]
        F2["Events Endpoint"]
        F3["Model Registry Client"]
    end

    subgraph STORE["Storage"]
        G1[("Object Storage")]
        G2[("PostgreSQL")]
        G3[("Redis")]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> G1
    B2 --> C1
    C1 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> E1
    E1 --> E2
    E2 --> E3
    D4 -.->|event embedding| E2
    E3 --> G1
    D4 --> G2
    E3 --> G2
    G1 <--> F3
    G2 --> F1
    G2 --> F2
    G3 <--> F1
```

`D1` (the EFI baseline) and `E1` (the U-Net baseline) sit *in the same position* in the graph as their ML successors, `D2/D3` and `E2` — they are alternate implementations of the same interface, not separate pipelines (see [Section 8.5](#85-stage-interfaces)).

## 7. Deployment & Component Architecture

This is the same logical pipeline mapped onto actual services and containers:

```mermaid
flowchart LR
    Browser(("Browser"))

    subgraph WEB["apps/web (Next.js)"]
        WebApp["Dashboard UI"]
    end

    subgraph API["apps/api (Fastify + tRPC)"]
        Gateway["Gateway API"]
        WS["WebSocket Server"]
    end

    subgraph MLSVC["apps/ml-service (FastAPI)"]
        MLApi["Inference API"]
        CeleryWorker["Celery Worker"]
        CeleryBeat["Celery Beat"]
    end

    subgraph GPU["GPU Node"]
        Torch["PyTorch: GNN + Diffusion"]
    end

    subgraph DATA["Data Layer"]
        PG[("PostgreSQL + PostGIS")]
        Redis[("Redis")]
        S3[("MinIO / S3")]
        MLflow[("MLflow")]
    end

    Browser --> WebApp
    WebApp --> Gateway
    Gateway --> WS
    Gateway --> PG
    Gateway --> Redis
    Gateway --> MLApi
    MLApi --> Redis
    MLApi --> PG
    CeleryBeat --> CeleryWorker
    CeleryWorker --> Torch
    CeleryWorker --> S3
    CeleryWorker --> PG
    MLApi --> MLflow
    CeleryWorker --> MLflow
```

Key boundary: **the browser never talks to `apps/ml-service` directly.** `apps/api` is the only public surface; `ml-service` is internal, which keeps GPU-bound infrastructure off the public network and lets the gateway own auth, rate limiting, and caching in one place.

## 8. ML Pipeline Architecture

### 8.1 Stage 0 — non-ML baseline (ships first)

A statistical anomaly score, cheap enough to run before any model is trained, and useful forever as a sanity check for the GNN:

```
anomaly_score = (forecast_value - climatology_mean) / climatology_std
```

Threshold (e.g. `|z| > 2`), label connected components (`scipy.ndimage.label`), and compute centroid/bbox/max-intensity per region. This is a simplified proxy for the true operational EFI, which compares the full ensemble's empirical CDF against the climatological CDF rather than just mean and standard deviation — worth implementing as a refinement once the simple z-score baseline is validated end-to-end.

### 8.2 Stage 1 — GNN event tracker

**Mesh.** Build an icosahedral mesh by recursively subdividing a base 12-vertex icosahedron and projecting onto the sphere (`trimesh`, or a hand-rolled subdivision — HEALPix is a reasonable alternative with convenient equal-area cells). Regrid each NWP lat/lon cell onto its nearest mesh node to populate node features. A second, coarser mesh for long-range message passing (GraphCast's multi-mesh idea) is a good v2 addition, not required for v1.

**Node features:**

```python
NODE_FEATURES = [
    "temperature_2m",
    "mean_sea_level_pressure",
    "relative_humidity_700hpa",
    "u_wind_850hpa",
    "v_wind_850hpa",
    "total_precipitation_6h",
    "geopotential_500hpa",
    "efi_score",        # Stage 0 output, fed back in as a strong prior
]
```

**Model sketch:**

```python
import torch
from torch_geometric.nn import MessagePassing
from torch_geometric.utils import add_self_loops

class MeshAnomalyLayer(MessagePassing):
    """One message-passing step over the icosahedral mesh."""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__(aggr="mean")
        self.lin = torch.nn.Linear(in_channels * 2, out_channels)

    def forward(self, x, edge_index):
        edge_index, _ = add_self_loops(edge_index, num_nodes=x.size(0))
        return self.propagate(edge_index, x=x)

    def message(self, x_i, x_j):
        return self.lin(torch.cat([x_i, x_j], dim=-1))


class MeshTracker(torch.nn.Module):
    """Stage 1: node features -> per-node extreme-event probability."""

    def __init__(self, in_channels: int, hidden: int = 128, layers: int = 4):
        super().__init__()
        dims = [in_channels] + [hidden] * layers
        self.convs = torch.nn.ModuleList(
            MeshAnomalyLayer(dims[i], dims[i + 1]) for i in range(layers)
        )
        self.head = torch.nn.Linear(hidden, 1)

    def forward(self, x, edge_index):
        for conv in self.convs:
            x = torch.relu(conv(x, edge_index))
        return torch.sigmoid(self.head(x)).squeeze(-1)  # [num_nodes]
```

Node probabilities feed a temporal attention block across forecast steps (and, if using ensemble input, an attention block across members), then thresholding + connected components + a simple centroid tracker turn the probability field into `EventCandidate` objects — the model outputs `P(anomaly | x)`, not a hand-asserted exact trajectory; the trajectory is a downstream aggregation of that probability field, which is more defensible than having the network regress a bounding box directly.

### 8.3 Stage 2 — downscaler

**Baseline first:** a plain U-Net regressor, 12 km context → 5 km field, trained with a normal reconstruction loss. This exists purely as the thing the diffusion model has to beat — without it there's no baseline to measure "does diffusion actually preserve extremes better."

**Diffusion model:** a conditional DDPM built on `diffusers`' `UNet2DConditionModel`, conditioned via cross-attention on the Stage 1 event embedding plus static topography, with the coarse 12 km field concatenated as extra input channels.

```python
from diffusers import UNet2DConditionModel, DDPMScheduler

downscaler = UNet2DConditionModel(
    sample_size=64,             # 5 km patch, e.g. 64x64 cells
    in_channels=8,               # met variables + interpolated 12km context
    out_channels=6,              # predicted 5km variables
    cross_attention_dim=256,     # matches the Stage 1 event embedding
    layers_per_block=2,
    block_out_channels=(64, 128, 256, 256),
)
scheduler = DDPMScheduler(num_train_timesteps=1000, beta_schedule="squaredcos_cap_v2")

# training step (simplified)
noise = torch.randn_like(target_5km)
timesteps = torch.randint(0, scheduler.config.num_train_timesteps, (batch_size,))
noisy_target = scheduler.add_noise(target_5km, noise, timesteps)

noise_pred = downscaler(
    noisy_target, timesteps,
    encoder_hidden_states=event_embedding,     # [batch, seq_len, 256]
).sample

loss = physics_informed_loss(noise_pred, noise, cond=coarse_context, climatology=clim)
```

At inference, sample with a faster scheduler (e.g. DDIM, ~50 steps) and draw an ensemble of N samples (20–50) per event so the output is a *distribution* at 5 km, not a single deterministic field — the local-scale analogue of what GenCast does globally. If the raw 5 km × channels tensor is too large to diffuse directly, compress with a small autoencoder first and diffuse in latent space; treat this as an optimization to reach for only if training throughput demands it, not a v1 requirement.

### 8.4 Physics-informed loss

```python
def total_loss(noise_pred, noise_true, pred_field, target_field, cond, climatology):
    l_diffusion = mse(noise_pred, noise_true)

    weight = extreme_weight(target_field, climatology)     # grows with percentile rank
    l_extreme = (weight * (pred_field - target_field) ** 2).mean()

    l_spectral = radial_power_spectrum_l1(pred_field, target_field)  # fights blurring

    l_physics = (
        moisture_precip_consistency(pred_field, cond.humidity, cond.wind)
        + thermodynamic_consistency(pred_field, cond.temperature, cond.pressure)
    )

    return l_diffusion + LAMBDA_EXTREME * l_extreme + LAMBDA_SPECTRAL * l_spectral + LAMBDA_PHYSICS * l_physics
```

Start with these four terms, computed with MetPy where possible; don't attempt a full Navier–Stokes constraint set in v1 — each additional term should be added only once it demonstrably improves the extreme-percentile metrics in [Section 15](#15-evaluation--validation-plan).

### 8.5 Stage interfaces

The contract every Stage 1 implementation (baseline or GNN) and every Stage 2 implementation (U-Net or diffusion) must satisfy, so the serving layer never needs to know which one is active:

```python
@dataclass
class EventCandidate:
    event_type: str                        # extreme_rainfall | heat_dome | cold_wave | cyclone
    probability: float
    centroid: tuple[float, float]          # (lat, lon)
    bbox: tuple[float, float, float, float]
    valid_time: datetime
    trajectory: list[tuple[float, float]] | None
    mesh_node_ids: list[int]               # used to crop Stage 2 input

@dataclass
class DownscaledField:
    event_id: str
    variable: str                          # precipitation | wind_speed | temperature
    resolution_km: float
    zarr_path: str                         # pointer into object storage, never inline arrays
    percentile: int | None                 # null = ensemble mean
    physics_valid: bool
    physics_report: dict
```

### 8.6 Model registry & experiment tracking

Every training run — baseline or ML — logs to MLflow with model name/version (`efi-baseline`, `gnn-tracker-v1`, `unet-downscaler-v1`, `diffusion-downscaler-v1`), metrics, and artifacts. `apps/ml-service` reads the model tagged `production` (or `staging` for a shadow deployment) at startup; promoting a new model is a registry action, not a deploy.

## 9. Data Architecture

### 9.1 Object storage layout

```
s3://weather-artifacts/
├── raw/
│   ├── neps-g/{init_time}/*.grib2
│   ├── ncum/{init_time}/*.grib2
│   └── era5/{year}/{month}/*.nc
├── interim/
│   └── zarr/{source}/{init_time}.zarr
├── processed/
│   ├── climatology/{variable}.zarr       # 30-year ERA5/IMDAA baseline stats
│   └── mesh/icosahedral_r5.json          # cached mesh topology
├── model-outputs/
│   └── {model_run_id}/
│       ├── stage1_events.json
│       └── stage2_field_5km.zarr
└── checkpoints/
    ├── tracker/{model_version}/model.pt
    └── downscaler/{model_version}/model.pt
```

Raw arrays and checkpoints live in object storage, never in Postgres — Postgres only ever stores a `zarr_path` pointer.

### 9.2 PostgreSQL schema

```mermaid
erDiagram
    MODEL_RUNS ||--o{ EVENTS : produces
    EVENTS ||--o{ EVENT_TRAJECTORY_POINTS : has
    EVENTS ||--o{ DOWNSCALED_FIELDS : has
    EVENTS ||--o{ ALERTS : triggers

    MODEL_RUNS {
        uuid id PK
        text model_name
        text model_version
        timestamptz input_valid_time
        int forecast_hour
        text status
    }
    EVENTS {
        uuid id PK
        uuid model_run_id FK
        text event_type
        text severity
        real probability
        geography centroid
        geography bbox
        timestamptz valid_time
    }
    EVENT_TRAJECTORY_POINTS {
        uuid id PK
        uuid event_id FK
        timestamptz step_time
        geography location
        real intensity
        int sequence_index
    }
    DOWNSCALED_FIELDS {
        uuid id PK
        uuid event_id FK
        text zarr_path
        real resolution_km
        text variable
        int percentile
    }
    ALERTS {
        uuid id PK
        uuid event_id FK
        text severity
        real radius_km
        text message
        timestamptz dispatched_at
    }
```

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE model_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,                -- efi-baseline | gnn-tracker-v1 | unet-downscaler-v1 | diffusion-downscaler-v1
    model_version TEXT NOT NULL,
    mlflow_run_id TEXT,
    input_valid_time TIMESTAMPTZ NOT NULL,   -- NWP init/analysis time
    forecast_hour INT NOT NULL,              -- lead time, 0-240
    status TEXT NOT NULL DEFAULT 'pending',  -- pending|running|succeeded|failed
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_run_id UUID REFERENCES model_runs(id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,                  -- low|moderate|severe
    probability REAL NOT NULL,
    centroid GEOGRAPHY(POINT, 4326) NOT NULL,
    bbox GEOGRAPHY(POLYGON, 4326) NOT NULL,
    valid_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_trajectory_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    step_time TIMESTAMPTZ NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    intensity REAL,
    sequence_index INT NOT NULL
);

CREATE TABLE downscaled_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    zarr_path TEXT NOT NULL,
    resolution_km REAL NOT NULL DEFAULT 5,
    variable TEXT NOT NULL,
    percentile INT,                           -- null = ensemble mean
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    severity TEXT NOT NULL,
    radius_km REAL NOT NULL DEFAULT 5,
    message TEXT NOT NULL,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_centroid ON events USING GIST (centroid);
CREATE INDEX idx_events_bbox ON events USING GIST (bbox);
CREATE INDEX idx_events_valid_time ON events (valid_time);
```

### 9.3 Redis key namespace

```
forecast:{lat}:{lon}:{hour}          cached point-forecast JSON, TTL ~5 min
events:bbox:{geohash}:{valid_time}   cached event query, TTL ~5 min
celery:*                              Celery broker/result-backend keys
alerts:pubsub                         pub/sub channel, fans out to WebSocket clients
ratelimit:{ip}                        gateway rate limiting
```

## 10. Service Architecture & API Contracts

### 10.1 apps/ml-service (Python/FastAPI) — internal only

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Liveness/readiness |
| `/internal/forecast` | POST | Point forecast: `{lat, lon, forecast_hour}` → event/severity/probability/centroid/radius |
| `/internal/events` | GET | List events by bbox / valid_time / event_type |
| `/internal/events/{id}` | GET | Event detail incl. trajectory + downscaled-field pointer |
| `/internal/events/{id}/field` | GET | Signed URL (or rendered preview) for the 5 km Zarr array |
| `/internal/jobs/ingest` | POST | Trigger a Celery ingestion+tracking job (Beat or manual backfill) |
| `/internal/jobs/{job_id}` | GET | Job status |

```python
# apps/ml-service/app/routers/forecast.py
from fastapi import APIRouter
from app.schemas import ForecastRequest, ForecastResponse
from app.services.inference_service import InferenceService

router = APIRouter(prefix="/internal", tags=["forecast"])
inference = InferenceService()

@router.post("/forecast", response_model=ForecastResponse)
async def get_forecast(req: ForecastRequest) -> ForecastResponse:
    candidates = await inference.track(req.lat, req.lon, req.forecast_hour)
    if not candidates:
        return ForecastResponse(event=None)
    top = max(candidates, key=lambda c: c.probability)
    field = await inference.downscale(top)
    return ForecastResponse.from_candidate(top, field)
```

Example response:

```json
{
  "event": "extreme_rainfall",
  "severity": "severe",
  "probability": 0.87,
  "centroid": { "lat": 23.6, "lon": 87.4 },
  "radius_km": 5,
  "forecast_hours": 72,
  "model_run_id": "2f6a...b91"
}
```

FastAPI generates an OpenAPI schema automatically from these Pydantic models; `apps/api` regenerates a typed TS client from it (`openapi-typescript` against `/openapi.json`) as a build step, so the gateway never hand-maintains the ml-service contract.

### 10.2 apps/api (TypeScript/Fastify + tRPC) — public surface

| Router.procedure | Type | Purpose |
|---|---|---|
| `forecast.getPointForecast` | query | Proxies + caches `POST /internal/forecast` |
| `events.list` | query | Proxies + caches `GET /internal/events` |
| `events.getById` | query | Proxies `GET /internal/events/{id}` |
| `alerts.list` | query | Recent alerts |
| `alerts.onNewAlert` | subscription | WebSocket stream of new alerts |
| `/healthz` | REST | Infra health check |

```typescript
// apps/api/src/router/forecast.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { mlServiceClient } from "../ml-client";

export const forecastRouter = router({
  getPointForecast: publicProcedure
    .input(z.object({
      lat: z.number(),
      lon: z.number(),
      forecastHour: z.number().min(0).max(240),
    }))
    .query(async ({ input, ctx }) => {
      const cacheKey = `forecast:${input.lat}:${input.lon}:${input.forecastHour}`;
      const cached = await ctx.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const result = await mlServiceClient.POST("/internal/forecast", { body: input });
      await ctx.redis.set(cacheKey, JSON.stringify(result), "EX", 300);
      return result;
    }),
});
```

### 10.3 apps/web (Next.js dashboard)

- Map view (MapLibre + deck.gl): event polygons, trajectories, 5 km raster overlay layered on the coarse 12 km context
- Event explorer: filter by type/severity/time, drill into an event's trajectory and downscaled field
- Alert feed: live via the `alerts.onNewAlert` subscription
- Everything reads through `packages/schemas` (Zod) so the UI and the gateway can never drift out of type-sync

## 11. Sequence Diagrams

### 11.1 On-demand point forecast

```mermaid
sequenceDiagram
    participant Browser
    participant Web as Dashboard
    participant Gateway as API Gateway
    participant ML as ML Service
    participant Cache as Redis
    participant DB as PostgreSQL

    Browser->>Web: Select location + lead time
    Web->>Gateway: GET /forecast
    Gateway->>Cache: Check cache
    alt cache hit
        Cache-->>Gateway: Cached forecast
    else cache miss
        Gateway->>ML: POST /internal/forecast
        ML->>DB: Query latest model_run + events
        DB-->>ML: Event rows
        ML-->>Gateway: Forecast JSON
        Gateway->>Cache: Store with TTL
    end
    Gateway-->>Web: Forecast JSON
    Web-->>Browser: Render map marker + risk card
```

### 11.2 Scheduled ingestion → tracking → downscaling → alert

```mermaid
sequenceDiagram
    participant Scheduler as Celery Beat
    participant Worker as Celery Worker
    participant Core as ml-core Pipeline
    participant Store as Object Storage
    participant DB as PostgreSQL
    participant Gateway as API Gateway
    participant Clients as WebSocket Clients

    Scheduler->>Worker: Trigger ingest_and_track
    Worker->>Store: Fetch latest GRIB2 data
    Worker->>Core: Preprocess, mesh, Stage 1 tracker
    Core-->>Worker: Candidate events
    Worker->>Core: Stage 2 downscale
    Core-->>Worker: 5km field + physics report
    Worker->>Store: Write Zarr field
    Worker->>DB: Insert events, fields, alerts
    Worker->>Gateway: Notify new alerts
    Gateway->>Clients: Push alert
```

## 12. Local Development

```yaml
# infra/docker-compose.yml (abridged)
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: weather
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  mlflow:
    image: ghcr.io/mlflow/mlflow:latest
    command: mlflow server --host 0.0.0.0 --backend-store-uri postgresql://postgres:postgres@postgres/mlflow
    ports: ["5000:5000"]
    depends_on: [postgres]

volumes:
  pgdata:
```

```bash
# one-time setup
pnpm install
uv sync --all-packages                              # installs ml-core + ml-service deps into one venv
docker compose -f infra/docker-compose.yml up -d    # postgres, redis, minio, mlflow

# day to day
turbo dev              # web + api + ml-service, concurrently, cached
turbo test              # vitest (TS) + pytest (Python) across the workspace
turbo lint typecheck    # eslint/tsc for TS, ruff/mypy for Python
```

Prerequisites: Node 22 LTS, pnpm 9+, Python 3.12+, `uv`, Docker, and an NVIDIA GPU for training (inference can fall back to CPU for prototype-scale latency, or a mocked model response while the real one trains).

### Environment variables (excerpt)

```bash
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/weather
REDIS_URL=redis://localhost:6379
ML_SERVICE_URL=http://localhost:8001
JWT_SECRET=change-me

# apps/ml-service/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/weather
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=weather-artifacts
MLFLOW_TRACKING_URI=http://localhost:5000
MODEL_REGISTRY_STAGE=staging   # staging|production
CUDA_VISIBLE_DEVICES=0
```

## 13. Deployment & CI/CD

**Prototype deployment:** the same Docker Compose stack, deployed to a single GPU-equipped VM, behind a reverse proxy (Caddy or Nginx) terminating TLS. This is enough to demo the full pipeline live and is the right amount of infrastructure for a v1.

**Scale-out path (post-prototype):** split `ml-service` inference onto a dedicated GPU node pool in Kubernetes (or a model server like Triton/KServe), move to managed Postgres/Redis, S3 + CDN for the dashboard, and keep the same monorepo/CI feeding all of it.

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: "pnpm" }
      - uses: astral-sh/setup-uv@v3
      - run: pnpm install --frozen-lockfile
      - run: uv sync --all-packages
      - name: Turbo (affected packages only)
        run: pnpm turbo run lint typecheck test build --filter=...[origin/main]
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}

  model-eval-gate:
    if: contains(github.event.pull_request.labels.*.name, 'touches-ml-core')
    runs-on: [self-hosted, gpu]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv run --package ml-core python -m ml_core.training.eval --held-out data/eval/events.json
      - run: uv run --package ml-core python -m ml_core.training.check_regression --baseline mlflow://production
```

The `--filter=...[origin/main]` pattern plus Turborepo's remote cache means a PR that only touches `apps/web` never re-runs the Python test suite. The `model-eval-gate` job is the important addition for an ML repo: any PR touching `packages/ml-core` has to clear a held-out evaluation and a regression check against the current production model before merge — the equivalent of a test suite, but for model quality.

## 14. Phased Build Roadmap

Durations are relative, not calendar-fixed — scale to team size. Each phase ends with something demoable.

| Phase | Weeks | Deliverable |
|---|---|---|
| 0 — Scaffolding | 0–1 | Turborepo + pnpm workspaces initialized; empty `web`/`api`/`ml-service`; Docker Compose (Postgres+PostGIS, Redis, MinIO, MLflow); CI skeleton |
| 1 — Data pipeline | 1–3 | ERA5/IMDAA ingestion via Xarray+Dask into Zarr on MinIO; validated on one historical event window |
| 2 — Non-ML anomaly baseline | 3–4 | EFI-style z-score detector; centroid/bbox/intensity stored to Postgres; **first real end-to-end path** — dashboard already renders something true |
| 3 — Temporal tracking (non-ML) | 4–5 | Frame-to-frame nearest-centroid tracker → trajectory JSON; `events/{id}/trajectory` + map polyline |
| 4 — GNN tracker | 5–8 | Icosahedral mesh + PyG message passing; node-level anomaly probability; swapped in behind the Stage 1 interface; baseline vs. GNN compared in MLflow |
| 5 — Downscaling baseline (U-Net) | 8–10 | Deterministic 12→5 km U-Net; `/forecast` returns a real 5 km field; dashboard renders the raster overlay |
| 6 — Conditional diffusion downscaler | 10–14 | Cross-attention conditional DDPM; compared against the U-Net baseline on extreme-percentile bias, CRPS, spectral error |
| 7 — Physics-informed loss | 14–16 | Moisture/thermodynamic/spectral loss terms added; ablation table with/without physics loss |
| 8 — Alerting & productionization | 16–18 | Celery Beat scheduled ingestion, severity thresholds, WebSocket push, notification log; full pipeline running on a schedule against recent NWP data |

## 15. Evaluation & Validation Plan

**Baselines, in order of increasing sophistication:** nearest-neighbor interpolation → deterministic U-Net → conditional diffusion (→ full model, GNN tracker + diffusion downscaler).

**Metrics** — evaluate on the extreme tail specifically, not just average error:
- RMSE / MAE
- CRPS (ensemble calibration)
- FSS (Fractions Skill Score)
- CSI (Critical Success Index)
- 95th / 99th percentile bias
- Extreme-event recall
- Peak intensity error
- Spectral error (radially-averaged power spectrum)
- Reliability / calibration diagrams
- Cyclone-track error, where applicable

**Discipline:** treat statements like "preserves extreme amplitudes better than a CNN" or "probabilistically sound at 5 km" as hypotheses the evaluation suite has to clear, not established facts to assert in a proposal or demo — the whole point of Stage 0/baseline-first development in Section 14 is to make every later claim falsifiable against something simpler.

## 16. Risks & Open Questions

- **Restricted data access.** NEPS-G/NCUM may require institutional access (NCMRWF/IMD). Build and validate Phases 1–7 against public ERA5/IMDAA first so the pipeline doesn't block on data-access approval.
- **GPU memory for diffusion training.** If the 5 km × channels tensor doesn't fit comfortably, fall back to the latent-diffusion variant described in 8.3 rather than shrinking patch size, which would defeat the point.
- **Mesh resolution vs. compute.** Finer icosahedral refinement improves localization but grows the graph fast; start coarse (validate the pipeline), refine once Stage 1 accuracy — not compute — is the bottleneck.
- **`experimentalPythonWorkspaces`.** If Approach B (Section 5.2) is adopted before it stabilizes, pin the exact Turborepo version everywhere (local + CI) and revisit at each Turborepo upgrade.
- **Alert-threshold tuning.** Low/moderate/severe cutoffs need domain input (meteorologists, NDRF) — don't hard-code thresholds the eval suite hasn't validated against false-alarm rate.
- **Ensemble scope.** v1 tracks per-member and summarizes; a true GenCast-style generative global ensemble is a meaningfully larger undertaking and is deliberately deferred (Section 2).

## 17. Appendix

**Glossary**

| Term | Meaning |
|---|---|
| NWP | Numerical Weather Prediction |
| EPS | Ensemble Prediction System |
| EFI | Extreme Forecast Index — forecast vs. climatology anomaly score |
| GNN | Graph Neural Network |
| DDPM | Denoising Diffusion Probabilistic Model |
| CRPS | Continuous Ranked Probability Score |
| FSS | Fractions Skill Score |
| CSI | Critical Success Index |
| NEPS-G | NCMRWF Ensemble Prediction System – Global |
| NCUM | NCMRWF Unified Model (deterministic) |
| IMDAA | Indian Monsoon Data Assimilation and Analysis (reanalysis) |
