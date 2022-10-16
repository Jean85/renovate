import { mergeChildConfig } from '../../../config';
import { getConfig } from '../../../config/defaults';
import { getManagerList } from '../../../modules/manager';
import { generateFingerprintConfig } from './extract-fingerprint-config';

describe('workers/repository/extract/extract-fingerprint-config', () => {
  it('filter with enabledManagers', () => {
    const config = mergeChildConfig(getConfig(), {
      registryAliases: {
        stable: 'http://some.link',
      },
      ignorePaths: ['ignore-path-1'],
      includePaths: ['include-path-1'],
      npm: {
        fileMatch: ['hero.json'],
        ignorePaths: ['ignore-path-2'],
        includePaths: ['include-path-2'],
        registryAliases: {
          notStable: 'http://some.link.2',
        },
      },
      enabledManagers: ['npm', 'regex'],
    });
    config.regexManagers = [
      {
        fileMatch: ['js', '***$}{]]['],
        matchStrings: ['^(?<depName>foo)(?<currentValue>bar)$'],
        datasourceTemplate: 'maven',
        versioningTemplate: 'gradle',
      },
    ];
    const fingerprintConfig = generateFingerprintConfig(config);

    expect(fingerprintConfig.managerList).toEqual(['npm', 'regex']);
    expect(
      fingerprintConfig.managers.find((manager) => manager.manager === 'npm')
    ).toEqual({
      enabled: true,
      fileMatch: ['(^|/)package\\.json$', 'hero.json'],
      ignorePaths: ['ignore-path-2'],
      includePaths: ['include-path-2'],
      manager: 'npm',
      npmrc: null,
      npmrcMerge: false,
      registryAliases: {
        stable: 'http://some.link',
        notStable: 'http://some.link.2',
      },
      skipInstalls: null,
    });
    expect(
      fingerprintConfig.managers.find((manager) => manager.manager === 'regex')
    ).toEqual({
      fileMatch: ['js', '***$}{]]['],
      fileList: [],
      matchStrings: ['^(?<depName>foo)(?<currentValue>bar)$'],
      datasourceTemplate: 'maven',
      versioningTemplate: 'gradle',
      enabled: true,
      manager: 'regex',
    });
  });

  it('filter with all managers enabled', () => {
    const config = mergeChildConfig(getConfig(), {
      npmrc: 'some-string',
      npmrcMerge: true,
      npm: { fileMatch: ['hero.json'] },
    });
    const fingerprintConfig = generateFingerprintConfig(config);
    expect(fingerprintConfig.managerList).toEqual(getManagerList());
    expect(
      fingerprintConfig.managers.find((manager) => manager.manager === 'npm')
    ).toEqual({
      enabled: true,
      fileMatch: ['(^|/)package\\.json$', 'hero.json'],
      ignorePaths: [],
      includePaths: [],
      manager: 'npm',
      npmrc: 'some-string',
      npmrcMerge: true,
      registryAliases: {},
      skipInstalls: null,
    });
    expect(
      fingerprintConfig.managers.find(
        (manager) => manager.manager === 'dockerfile'
      )
    ).toEqual({
      enabled: true,
      fileMatch: ['(^|/|\\.)Dockerfile$', '(^|/)Dockerfile[^/]*$'],
      ignorePaths: [],
      includePaths: [],
      manager: 'dockerfile',
      npmrc: 'some-string',
      npmrcMerge: true,
      registryAliases: {},
      skipInstalls: null,
    });
    expect(
      fingerprintConfig.managers.find((manager) => manager.manager === 'regex')
    ).toBeUndefined();
  });
});
