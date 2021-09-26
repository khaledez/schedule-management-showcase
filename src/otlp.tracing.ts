import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const provider = new NodeTracerProvider({
  resource: Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'aws-otel-integ-test',
    }),
  ),
  idGenerator: new AWSXRayIdGenerator(),
});
provider.register({ propagator: new AWSXRayPropagator() });

provider.addSpanProcessor(new BatchSpanProcessor(new CollectorTraceExporter()));

registerInstrumentations({
  instrumentations: [
    // Express instrumentation expects HTTP layer to be instrumented
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

export const tracer = provider.getTracer('schedule-management');
