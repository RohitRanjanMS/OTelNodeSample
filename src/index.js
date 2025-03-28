import { app } from '@azure/functions';
import http from 'https';
import azureInstrumentation from '@azure/functions-opentelemetry-instrumentation';
import { AzureMonitorLogExporter, AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { getNodeAutoInstrumentations, getResourceDetectors } from '@opentelemetry/auto-instrumentations-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { detectResourcesSync } from '@opentelemetry/resources';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { trace, context } from '@opentelemetry/api';
const resource = detectResourcesSync({ detectors: getResourceDetectors() });
const tracerProvider = new NodeTracerProvider({ resource });

tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new AzureMonitorTraceExporter()));
tracerProvider.register();

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new AzureMonitorLogExporter()));

registerInstrumentations({
  tracerProvider,
  loggerProvider,
  instrumentations: [getNodeAutoInstrumentations(), new azureInstrumentation.AzureFunctionsInstrumentation()],
});

app.setup({
  enableHttpStream: true,
});
