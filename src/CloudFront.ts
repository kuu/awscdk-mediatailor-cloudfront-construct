import { Aws, Fn } from 'aws-cdk-lib';
import {
  OriginRequestPolicy,
  OriginSslPolicy,
  OriginProtocolPolicy,
  Distribution,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
  CachePolicy,
  AllowedMethods,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface CloudFrontProps {
  readonly videoContentSourceUrl: string;
  readonly mediaTailorEndpointUrl: string;
}

export class CloudFront extends Construct {
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    mediaTailorEndpointUrl,
  }: CloudFrontProps) {

    super(scope, id);

    // Create content origin
    const videoContentOrigin = new HttpOrigin(
      Fn.select(2, Fn.split('/', videoContentSourceUrl)),
      {
        originSslProtocols: [OriginSslPolicy.SSL_V3],
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      },
    );

    // Create MediaTailor origin
    const mediaTailorOrigin = new HttpOrigin(
      Fn.select(2, Fn.split('/', mediaTailorEndpointUrl)),
      {
        originSslProtocols: [OriginSslPolicy.SSL_V3],
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      },
    );

    // Create Transcoded Ad origin
    const transocdedAdOrigin = new HttpOrigin(
      `segments.mediatailor.${Aws.REGION}.amazonaws.com`,
      {
        originSslProtocols: [OriginSslPolicy.SSL_V3],
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      },
    );

    // Create CloudFront distribution
    const distribution = new Distribution(this, 'Distribution', {
      comment: `${Aws.STACK_NAME} - CDK deployment Secure Media Delivery`,
      defaultRootObject: '',
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2016,
      defaultBehavior: { // HLS/DASH segment
        origin: videoContentOrigin,
        cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/v1/m*': { // MediaTailor HLS manifest
          origin: mediaTailorOrigin,
          cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: OriginRequestPolicy.ELEMENTAL_MEDIA_TAILOR,
        },
        '/v1/dash/*': { // MediaTailor DASH manifest
          origin: mediaTailorOrigin,
          cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: OriginRequestPolicy.ELEMENTAL_MEDIA_TAILOR,
        },
        '/tm/*': { // MediaTailor transcoded Ad segments
          origin: transocdedAdOrigin,
          cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: OriginRequestPolicy.ELEMENTAL_MEDIA_TAILOR,
        },
        '/v1/segment/*': { // MediaTailor server-side tracking
          origin: mediaTailorOrigin,
          cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy: OriginRequestPolicy.ELEMENTAL_MEDIA_TAILOR,
        },
      },
    });

    this.distribution = distribution;
  }
}