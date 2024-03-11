import { Aws, Fn } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { CloudFront } from './CloudFront';
import { MediaTailor } from './MediaTailor';

function removeFilename(url: string): string {
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash === -1) {
    return url;
  }
  return url.substring(0, url.lastIndexOf('/'));
}

export interface MediaTailorWithCloudFrontProps {
  readonly videoContentSourceUrl: string; // The URL of the MediaPackage endpoint used by MediaTailor as the content origin.
  readonly adDecisionServerUrl: string; // The URL of the ad server used by MediaTailor as the ADS.
  readonly slateAdUrl?: string; // The URL of the video file used by MediaTailor as the slate.
}

export class MediaTailorWithCloudFront extends Construct {
  public readonly emt: MediaTailor;
  public readonly cf: CloudFront;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    adDecisionServerUrl,
    slateAdUrl,
  }: MediaTailorWithCloudFrontProps) {

    super(scope, id);

    const idDash = videoContentSourceUrl.endsWith('.mpd');

    videoContentSourceUrl = removeFilename(videoContentSourceUrl);

    // Create MediaTailor PlaybackConfig
    const emt = new MediaTailor(this, 'MediaTailor', {
      videoContentSourceUrl,
      adDecisionServerUrl,
      slateAdUrl,
    });

    const mediaTailorEndpointUrl = idDash
      ? emt.config.attrDashConfigurationManifestEndpointPrefix
      : emt.config.attrHlsConfigurationManifestEndpointPrefix;

    // Create CloudFront Distribution
    const cf = new CloudFront(this, 'CloudFront', {
      videoContentSourceUrl,
      mediaTailorEndpointUrl,
    });

    // Create AWS Custom Resource to setup MediaTailor's CDN configuration with CloudFront
    const contentPath = Fn.select(1, Fn.split('/out/', videoContentSourceUrl));
    const contentSegmentPrefix =`https://${cf.distribution.distributionDomainName}/out/${contentPath}`;
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
            ContentSegmentUrlPrefix: contentSegmentPrefix,
          },
        },
        physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
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