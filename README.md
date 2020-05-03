# next.js serverless lambda handler

A simple interoperability wrapper for deploying a Next.js server with AWS Lambda and API Gateway

## Why:

- To make deploying a Next.js app w/ lambda serverless easy - while retaining full control over the contract.
  - e.g., you manage the domain name + routing
  - e.g., you have control over the "handler" and your custom server

## How:

- Translate between Lambda+ApiGatewayEvent and Next.js+Express+HttpServer
  - converts the ApiGatewayEvent that your lambda receives into an HttpRequest your Next.js/Express server expects
  - converts the HttpResponse your Next.js/Express returns into the payload that ApiGateway expects.

# Example

install

```sh
npm install --save nextjs-serverless-lambda-handler
```

setup your lambda

```ts
import express from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import next from 'next';

// decide whether we're running in development mode
const inDevMode = process.env.NODE_ENV === 'development'; // default to false

// setup our server dependencies
const app = next({ dev: inDevMode });
const handle = app.getRequestHandler();
const promisePrepared = app.prepare(); // define the promise in global context, so we only do it once per lambda container
const server = express();

// define the express routes that we want to use
server.get('*', async (req: IncomingMessage, res: ServerResponse) => {
  await promisePrepared; // wait for nextjs to be ready
  await handle(req, res); // use nextjs to process the req and send the res
});

// expose the handler
export const handler = createApiGatewayEventHandlerForNextJsCustomServer({ server });
```

deploy - with expected infrastructure (see below)

# Expected Infrastructure

Please back this ApiGateway triggered lambda with a CloudFront distribution.

Our recommendation is:

- set up the Lambda+ApiGateway using [Serverless](https://github.com/serverless/serverless)
- set up the CloudFront distribution using [Terraform](https://github.com/hashicorp/terraform)

### Api Gateway

Api Gateway enables lambdas to receive and respond to https requests, like any api. AWS manages spinning up and invoking your lambda on demand.

Here is an example `serverless.yml` config:

```yml
service: awesome-web-app-server

provider:
  name: aws
  runtime: nodejs12.x
  memorySize: 2048 # optional, in MB, default is 1024
  timeout: 27 # api gateway times out at 29 seconds, so wait up to as long as possible
  environment:
    NODE_ENV: ${opt:stage}

functions:
  ssr:
    handler: dist/ssr/handler.handler
    events:
      - http:
          method: GET
          path: '/' # catch root route
          cors: true
      - http:
          method: GET
          path: '/{any+}' # catch all other routs
          cors: true
```

### CloudFront Distribution

A CloudFront distribution does several things for us:

- Allows using a custom domain name for accessing this api gateway
- Enables removing the "stage" path prefix that api gateway requires automatically
- Cache's the responses from api gateway, based on the `Cache Control` `max-age` header that your Next.js/Express custom server returns, to reduce the number of requests that hit your lambda.

Here is an example CloudFront distribution module:

```tf
locals {
  awesome_domain_name = "www.awesomedomainname.com"
  api_gateway_host = "__random_numbers__.execute-api.__region__.amazonaws.com"
  api_gateway_stage = "__stage__"
}

locals {
  api_gateway_origin_id = "api-gateway-origin-1"
  seconds_per_day       = "${60 * 60 * 24}"
}

data "aws_acm_certificate" "domain_cert" {
  domain      = "*.awesomedomainname.com"
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}

// https://aws.amazon.com/premiumsupport/knowledge-center/api-gateway-cloudfront-distribution/
resource "aws_cloudfront_distribution" "web_app_cdn" {
  origin {
    domain_name = "${local.api_gateway_host}"
    origin_id   = "${local.api_gateway_origin_id}"

    origin_path = "/${local.api_gateway_stage}" # e.g., reroute `domain.com/cool-page` to `www.awesomedomainname.com/__stage__/cool-page`

    custom_origin_config {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # misc
  enabled         = true
  is_ipv6_enabled = true

  # which host names should we expect, if using a custom domain name
  aliases = ["${local.awesome_domain_name}]

  # settings for caching; https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html#cache-behavior-arguments
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${local.api_gateway_origin_id}"

    forwarded_values {
      query_string = true # web apps often use query strings, so we want to forward these

      cookies {
        forward = "none" # if your app needs cookies, change this
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 0 # by default, do not cache; each page defines its own cache rules. next.js does a good job optimizing this based on whether each path is static or dynamic
    max_ttl                = "${60 * 60 * 24 * 7}" # up to 7 days
  }

  restrictions {
    geo_restriction {
      restriction_type = "none" # no restrictions
    }
  }

  # must specify the https certificate if using a custom domain; not required if not using custom domain
  viewer_certificate {
    acm_certificate_arn = "${data.aws_acm_certificate.custom_domain_cert.arn}"
    ssl_support_method  = "sni-only"
  }
}
```

# Caveats

### ApiGateway mandatory url /stage prefix

The `/stage` prefix that aws requires on api gateway routes will not work with Next.js's routing expectations. To solve this currently, the only option is to use a CloudFront distribution which defines an `origin_path` that hides the `/stage` prefix.

The problem is that any requests that go to `__your_apigateway_subdomain__.amazonaws.com` root will fail. They have to go to `__your_apigateway_subdomain__.amazonaws.com/__stage__`.

But that means that when you load `__your_apigateway_subdomain__.amazonaws.com/__stage__/cool-page` and Next.js says to get resources from `/_next/.../__some_file__`, the browser will ask for `__your_apigateway_subdomain__.amazonaws.com/_next/.../__some_file__` and not `__your_apigateway_subdomain__.amazonaws.com/__stage__/_next/.../__some_file__`. Without the `__stage__` prefix, the request will fail

# Inspiration

This project is inspired by https://github.com/awslabs/aws-serverless-express. This project really is just a simpler implementation of that - while also fixing a problem which makes that package a blocker for Next.js: `content-encoding`. `aws-serverless-express` requires you to define a content encoding per mimetype - while Next.js may gzip or may not gzip per mimetype. For example, Next.js often does not compress small `.js` files while compressing the large ones. This package determines whether to return a "compressed" response based on the `content-encoding` header returned by Next.js, rather than statically based on the `mimetype` like the aws package does.
