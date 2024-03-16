import * as crypto from 'crypto';
import { Aws } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { CloudFront } from './CloudFront';
import { MediaTailor } from './MediaTailor';

export interface MediaTailorWithCloudFrontProps {
  readonly videoContentSourceUrl: string; // The URL of the MediaPackage endpoint used by MediaTailor as the content origin.
  readonly adDecisionServerUrl: string; // The URL of the ad server used by MediaTailor as the ADS.
  readonly slateAdUrl?: string; // The URL of the video file used by MediaTailor as the slate.
  readonly configurationAliases?: object; // The configuration aliases used by MediaTailor.
}

export class MediaTailorWithCloudFront extends Construct {
  public readonly emt: MediaTailor;
  public readonly cf: CloudFront;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    adDecisionServerUrl,
    slateAdUrl,
    configurationAliases,
  }: MediaTailorWithCloudFrontProps) {

    super(scope, id);

    // Create MediaTailor PlaybackConfig
    const emt = new MediaTailor(this, 'MediaTailor', {
      videoContentSourceUrl,
      adDecisionServerUrl,
      slateAdUrl,
      configurationAliases,
    });

    // Create CloudFront Distribution
    const cf = new CloudFront(this, 'CloudFront', {
      videoContentSourceUrl,
      mediaTailorEndpointUrl: emt.config.attrHlsConfigurationManifestEndpointPrefix,
    });

    // Create AWS Custom Resource to setup MediaTailor's CDN configuration with CloudFront
    new AwsCustomResource(this, 'AwsCustomResource', {
      onCreate: {
        service: 'MediaTailor',
        action: 'PutPlaybackConfiguration',
        region: Aws.REGION,
        parameters: {
          Name: emt.config.name,
          VideoContentSourceUrl: emt.config.videoContentSourceUrl,
          AdDecisionServerUrl: emt.config.adDecisionServerUrl,
          SlateAdUrl: emt.config.slateAdUrl,
          CdnConfiguration: {
            AdSegmentUrlPrefix: `https://${cf.distribution.distributionDomainName}`,
            ContentSegmentUrlPrefix: `https://${cf.distribution.distributionDomainName}/out/v1`,
          },
        },
        physicalResourceId: PhysicalResourceId.of(crypto.randomUUID()),
      },
      //Will ignore any resource and use the assumedRoleArn as resource and 'sts:AssumeRole' for service:action
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
    this.emt = emt;
    this.cf = cf;
  }
}
