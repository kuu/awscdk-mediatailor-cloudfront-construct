# awscdk-mediatailor-cloudfront-construct
CDK Construct to associate MediaTailor config with CloudFront distribution

[![View on Construct Hub](https://constructs.dev/badge?package=awscdk-mediatailor-cloudfront-construct)](https://constructs.dev/packages/awscdk-mediatailor-cloudfront-construct)

This CDK Construct consists of two resources:
* MediaTailor playback configuration
* CloudFront distribution

And then associates them by updating MediaTailor's settings:
* Content Segment Prefix: `https://{CloudFront hostname}/out/v1/{MediaPackage endpoint ID}`
* Ad Segment Prefix: `https://{CloudFront hostname}`


## Install
[![NPM](https://nodei.co/npm/awscdk-mediatailor-cloudfront-construct.png?mini=true)](https://nodei.co/npm/awscdk-mediatailor-cloudfront-construct/)

## Usage
```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MediaTailorWithCloudFront } from 'awscdk-mediatailor-cloudfront-construct';

export class ExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const videoContentSourceUrl = 'https://xxxx.mediapackage.us-east-1.amazonaws.com/out/v1/yyyy/index.m3u8';
    const adDecisionServerUrl = 'https://example-ad-server/vast';
    const slateAdUrl = 'https://example-bucket.s3.us-east-1.amazonaws.com/slate.mp4';

    // Create MediaTailor with CloudFront
    const res = new MediaTailorWithCloudFront(this, 'MediaTailorWithCloudFront', {
      videoContentSourceUrl, // (required) The origin URL
      adDecisionServerUrl, // (optional) The ad decision server URL
      slateAdUrl, // (optional) The URL of the slate video file
      // configurationAliases, // (optional) The configuration aliases used by MediaTailor
      // adDecisionFunction, // (optional) Instead of adDecisionServerUrl, you can specify a Lambda function that returns VAST/VMAP
      // adDecisionFunctionApiPath, // (optional) The API path (including query strings) used by MediaTailor for invoking the Lambda function
      // skipCloudFront, // (optional) Skip the CloudFront setup (default = false)
    });

    // You can access MediaTailor playback configuration attributes via `emt.config`
    new cdk.CfnOutput(this, "SessionInitializationPrefix", {
      value: res.emt.config.attrSessionInitializationEndpointPrefix,
      exportName: cdk.Aws.STACK_NAME + "SessionInitializationPrefix",
      description: "MediaTailor's session initialization prefix",
    });

    // You can access CloudFront distribution attributes via `cf.distribution`
    new cdk.CfnOutput(this, "CloudFrontHostname", {
      value: res.cf.distribution.distributionDomainName,
      exportName: cdk.Aws.STACK_NAME + "HLSPlaybackPrefix",
      description: "CloudFront distribution's host name",
    });
  }
}
```