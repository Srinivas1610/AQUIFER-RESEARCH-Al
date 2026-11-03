PYTHON = .venv\Scripts\python.exe
CONFIG_SMOKE = configs/smoke.yaml
CONFIG_BASE = configs/base.yaml

.PHONY: all smoke test data features splits baselines imputer teacher student calibration eval paper clean demo

all: data features splits baselines imputer teacher student calibration eval paper

demo:
	$(PYTHON) run_demo.py

smoke: synthetic
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_SMOKE)

test:
	$(PYTHON) -m pytest tests/ -v

synthetic:
	$(PYTHON) scripts/make_synthetic.py --n_wells 20

data:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase data

features:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase features

splits:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase splits

baselines:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase baselines

imputer:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase imputer

teacher:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase teacher

student:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase student

calibration:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase calibration

eval:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase eval

paper:
	$(PYTHON) scripts/run_pipeline.py --config $(CONFIG_BASE) --phase paper

clean:
	del /s /q data\interim\SYNTHETIC_* 2>nul
