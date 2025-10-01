/**
 * Copyright 2025 Cisco Systems, Inc. and its affiliates
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const shell = require('shelljs');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const chalk = (await import('chalk')).default;

    shell.echo(chalk.blue('Start generate bff...'));

    // Globals
    const IDENTITY_V1ALPHA1_PROTO_PATH = "proto/agntcy/identity/service/v1alpha1";
    const SHARED_V1ALPHA1_PROTO_PATH = "proto/agntcy/identity/service/shared/v1alpha1";
    const IDENTITY_V1ALPHA1_GENERATED_PATH = "agntcy/identity/service/v1alpha1";
    const SHARED_V1ALPHA1_GENERATED_PATH = "agntcy/identity/service/shared/v1alpha1";

    async function doRenameAndConvert(inputDir, outputDir) {
      shell.mkdir('-p', outputDir);
      const files = fs.readdirSync(inputDir);
      for (const file of files) {
        const filePath = path.join(inputDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          const name = file.split('.').slice(0, -1).join('.');
          shell.mv(filePath, path.join(inputDir, name));
          if (shell.exec(`swagger-typescript-api generate -p ./${path.join(inputDir, name)} -o ./src/api/generated/${outputDir} -n ${name}.api.ts --axios`).code !== 0) {
            shell.echo(chalk.red(`Error: swagger-typescript-api failed for ${name}.`));
          }
        }
      }
      shell.rm('-rf', outputDir);
    }

    // Function to generate code using buf
    function doGenerate(protoPath) {
      if (shell.exec(`buf generate --template buf.gen.openapiv2.yaml --output ../../../frontend --path ${protoPath}`).code !== 0) {
        shell.echo(chalk.red(`Error: buf generate failed for ${protoPath}.`));
        shell.exit(1);
      }
    }

    // Function to generate all code
    function doGenerateAll() {
      doGenerate(IDENTITY_V1ALPHA1_PROTO_PATH);
      doGenerate(SHARED_V1ALPHA1_PROTO_PATH);
    }

    // Function to rename and convert all files
    async function doRenameAndConvertAll() {
      await doRenameAndConvert(`generated/openapi/${IDENTITY_V1ALPHA1_GENERATED_PATH}`, 'identity');
      await doRenameAndConvert(`generated/openapi/${SHARED_V1ALPHA1_GENERATED_PATH}`, 'shared');
    }

    // Generate the code
    shell.echo(chalk.grey('Generating the code...'));
    shell.rm('-rf', '../generated');
    shell.rm('-rf', '../src/api/generated');
    shell.cd('../../backend/api/spec');
    doGenerateAll();
    shell.cd('../../../');
    shell.cd('frontend');
    await doRenameAndConvertAll();
    shell.exec('yarn run format');
    shell.echo(chalk.green('Generate bff completed.'));
  } catch (error) {
    shell.echo(`Generate bff failed due to: ${error}`);
    shell.exit(1);
  }
})();
