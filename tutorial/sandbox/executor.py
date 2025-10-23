import multiprocessing as mp
import queue
import textwrap
import traceback
from dataclasses import dataclass
from typing import Optional

import cadquery as cq

SAFE_GLOBALS = {
    'cq': cq,
    'cadquery': cq,
    '__builtins__': {
        'abs': abs,
        'min': min,
        'max': max,
        'sum': sum,
        'range': range
    }
}


@dataclass
class ExecutionResult:
    shape: Optional[cq.Shape]
    error: Optional[str]


def _runner(code: str, output: mp.Queue):
    namespace = {}
    try:
        exec(textwrap.dedent(code), SAFE_GLOBALS, namespace)
        result = namespace.get('result') or SAFE_GLOBALS.get('result')
        if isinstance(result, cq.Workplane):
            val = result.val()
            output.put(('ok', cq.Shape.cast(val)))
        elif isinstance(result, cq.Shape):
            output.put(('ok', result))
        elif hasattr(result, 'wrapped'):
            output.put(('ok', cq.Shape.cast(result)))
        else:
            output.put(('error', f"Expected 'result' to be a Workplane or Shape, got {type(result)}"))
    except Exception as exc:  # noqa: BLE001
        output.put(('error', ''.join(traceback.format_exception(exc))))


def execute_source(code: str, timeout: float = 5.0) -> ExecutionResult:
    output: mp.Queue = mp.Queue()
    process = mp.Process(target=_runner, args=(code, output))
    process.start()
    try:
        status, payload = output.get(timeout=timeout)
    except queue.Empty:
        process.terminate()
        return ExecutionResult(None, 'Execution timed out')
    finally:
        process.join(timeout=0.1)
        if process.is_alive():
            process.terminate()
    if status == 'ok':
        return ExecutionResult(cq.Shape.cast(payload), None)
    return ExecutionResult(None, payload)
