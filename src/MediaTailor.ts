import * as crypto from 'crypto';

import {
  CfnPlaybackConfiguration,
} from 'aws-cdk-lib/aws-mediatailor';

import { Construct } from 'constructs';

export interface MediaTailorProps {
  readonly videoContentSourceUrl: string;
  readonly adDecisionServerUrl: string;
  readonly slateAdUrl?: string;
}

export class MediaTailor extends Construct {
  public readonly config: CfnPlaybackConfiguration;

  constructor(scope: Construct, id: string, {
    videoContentSourceUrl,
    adDecisionServerUrl,
    slateAdUrl,
  }: MediaTailorProps) {

    super(scope, id);

    // Create EMT config
    this.config = new CfnPlaybackConfiguration(this, 'CfnPlaybackConfiguration', {
      name: `${crypto.randomUUID()}`,
      videoContentSourceUrl,
      adDecisionServerUrl,
      slateAdUrl,
    });
  }
}