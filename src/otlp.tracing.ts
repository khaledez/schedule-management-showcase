import { propagation, trace } from '@opentelemetry/api';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector-grpc';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { NodeTracerProvider } from '@opentelemetry/node';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';

export default function (serviceName) {
  // set global propagator
  propagation.setGlobalPropagator(new AWSXRayPropagator());
  // create a provider for activating and tracking with AWS IdGenerator
  const tracerConfig = {
    idGenerator: new AWSXRayIdGenerator(),
    // Any instrumentation plugins will be declared here
    plugins: {
      express: {
        enabled: true,
        path: '@opentelemetry/instrumentation-express',
      },
      mysql2: {
        enabled: true,
        path: '@opentelemetry/instrumentation-mysql2',
      },
    },
    // Any resources can be declared here
    resources: {},
  };
  const tracerProvider = new NodeTracerProvider(tracerConfig);
  // add OTLP exporter
  const otlpExporter = new CollectorTraceExporter({
    hostname: serviceName,
    url: 'localhost:55681',
  });
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter));
  // Register the tracer
  tracerProvider.register();
  // Return an tracer instance
  return trace.getTracer('sample-instrumentation');
}
