# awscdk-mediatailor-cloudfront-construct
This CDK Construct creates two resources:
* MediaTailor playback configuration
* CloudFront distribution

And then associates them by updating MediaTailor's settings:
* Content Segment Prefix: `https://{CloudFront hostname}/out/v1`
* Ad Segment Prefix: `https://{CloudFront hostname}`
