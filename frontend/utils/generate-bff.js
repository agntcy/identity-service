/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
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

    // Check if swagger-typescript-api is installed and install it if not
    shell.echo(chalk.grey('Check if swagger-typescript-api is installed...'));
    if (!shell.which('swagger-typescript-api')) {
      shell.echo(chalk.grey('swagger-typescript-api is not installed. Installing swagger-typescript-api...'));
      if (shell.exec('npm install swagger-typescript-api -g').code !== 0) {
        shell.echo(chalk.red('Error: swagger-typescript-api installation failed.'));
        shell.exit(1);
      }
    } else {
      shell.echo(chalk.green('swagger-typescript-api is already installed.'));
    }

    // Check if buf is installed and install it if not
    shell.echo(chalk.grey('Check if buf is installed...'));
    if (!shell.which('buf')) {
      shell.echo(chalk.grey('buf is not installed. Installing buf...'));
      if (shell.exec('npm install @bufbuild/buf -g').code !== 0) {
        shell.echo(chalk.red('Error: buf installation failed.'));
        shell.exit(1);
      }
    } else {
      shell.echo(chalk.green('buf is already installed.'));
    }

    // Globals
    const IDENTITY_V1ALPHA1_PROTO_PATH = "proto/agntcy/identity/platform/v1alpha1";
    const SHARED_V1ALPHA1_PROTO_PATH = "proto/agntcy/identity/platform/shared/v1alpha1";
    const IDENTITY_V1ALPHA1_GENERATED_PATH = "agntcy/identity/platform/v1alpha1";
    const SHARED_V1ALPHA1_GENERATED_PATH = "agntcy/identity/platform/shared/v1alpha1";

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
      if (shell.exec(`buf generate --template buf.gen.openapiv2.yaml --output ../../../ui --path ${protoPath}`).code !== 0) {
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
      await doRenameAndConvert(IDENTITY_V1ALPHA1_GENERATED_PATH, 'identity');
      await doRenameAndConvert(SHARED_V1ALPHA1_GENERATED_PATH, 'shared');
    }

    // Generate the code
    shell.echo(chalk.grey('Generating the code...'));
    shell.rm('-rf', '../agntcy');
    shell.rm('-rf', '../src/api/generated');
    shell.cd('../../backend/api/spec');
    doGenerateAll();
    shell.cd('../../../');
    shell.cd('ui');
    await doRenameAndConvertAll();
    shell.exec('yarn run format');
    shell.echo(chalk.green('Generate bff completed.'));
  } catch (error) {
    shell.echo(`Generate bff failed due to: ${error}`);
    shell.exit(1);
  }
})();
