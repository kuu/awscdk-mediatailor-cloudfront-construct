import * as crypto from 'crypto';
import { Fn } from 'aws-cdk-lib';
import { CfnPlaybackConfiguration } from 'aws-cdk-lib/aws-mediatailor';
import { Construct } from 'constructs';

export interface MediaTailorProps {
  readonly videoContentSourceUrl: string;
  readonly adDecisionServerUrl: string;
  readonly slateAdUrl?: string;
  readonly configurationAliases?: object;
}

export class MediaTailor extends Construct {
  public readonly config: CfnPlaybackConfiguration;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    adDecisionServerUrl,
    slateAdUrl,
    configurationAliases,
  }: MediaTailorProps) {

    super(scope, id);
    // Assuming the source is MediaPackage endpoint
    videoContentSourceUrl = `https://${Fn.parseDomainName(videoContentSourceUrl)}/out/v1/`;

    // Create EMT config
    this.config = new CfnPlaybackConfiguration(this, 'CfnPlaybackConfiguration', {
      name: `${crypto.randomUUID()}`,
      videoContentSourceUrl,
      adDecisionServerUrl,
      slateAdUrl,
      configurationAliases,
    });
  }
}