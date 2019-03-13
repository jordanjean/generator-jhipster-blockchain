const chalk = require('chalk');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const shelljs = require('shelljs');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            init(args) {
                if (args === 'default') {
                    // do something when argument is 'default'
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },
            displayLogo() {
                // it's here to show that you can use functions from generator-jhipster
                // this function is in: generator-jhipster/generators/generator-base.js
                this.printJHipsterLogo();

                // Have Yeoman greet the user.
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster blockchain')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            }
        };
    }

    prompting() {
        const prompts = [
            {
                type: 'input',
                name: 'message',
                message: 'Please put something',
                default: 'hello world!'
            }
        ];
    }

    writing() {
        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        // Check Gradle is used
        if (this.buildTool !== 'gradle'){
            this.log("ERROR: You must use Gradle as build tool to use this generator.");
            throw new Error("Gradle is not the build tool used here.")
        }

        // Write blockchain communication module package
        this.template('network', `${javaDir}/network`);

        // Write fabric-network folder
        this.template('fabric-network', 'fabric-network');

        // Write JDL file
        this.template('blockchain-jdl.jh', 'blockchain-jdl.jh');

        // Write RequestRessource.java file
        this.template('RequestResource.java', `${javaDir}/web/rest/RequestResource.java`);
    }

    install() {
        // Constants
		const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const packageName = this.jhipsterAppConfig.packageName;

        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/CAClient.java`,
            needle: 'import java.lang.reflect.InvocationTargetException;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/networkException/A_BlockchainException.java`,
            needle: 'public abstract class A_BlockchainException extends Exception {',
            splicable: [`package ${packageName}.network.networkException;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/networkException/EntityAlreadyExist.java`,
            needle: 'public class EntityAlreadyExist extends A_BlockchainException {',
            splicable: [`package ${packageName}.network.networkException;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/networkException/EntityNotFound.java`,
            needle: 'public class EntityNotFound extends A_BlockchainException {',
            splicable: [`package ${packageName}.network.networkException;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/networkException/StateAlreadySet.java`,
            needle: 'public class StateAlreadySet extends A_BlockchainException {',
            splicable: [`package ${packageName}.network.networkException;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/request/A_BlockchainRequest.java`,
            needle: 'import org.hyperledger.fabric.sdk.Channel;',
            splicable: [`package ${packageName}.network.request;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/request/Add.java`,
            needle: 'import static java.nio.charset.StandardCharsets.UTF_8;',
            splicable: [`package ${packageName}.network.request;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/request/Delete.java`,
            needle: 'import static java.nio.charset.StandardCharsets.UTF_8;',
            splicable: [`package ${packageName}.network.request;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/request/Get.java`,
            needle: 'import java.util.Collection;',
            splicable: [`package ${packageName}.network.request;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/request/Set.java`,
            needle: 'import static java.nio.charset.StandardCharsets.UTF_8;',
            splicable: [`package ${packageName}.network.request;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/CAEnrollment.java`,
            needle: 'import java.io.Serializable;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/ChannelClient.java`,
            needle: 'import static java.nio.charset.StandardCharsets.UTF_8;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/Config.java`,
            needle: 'import java.io.File;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/FabricClient.java`,
            needle: 'import java.io.File;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/UserContext.java`,
            needle: 'import java.io.Serializable;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/network/Util.java`,
            needle: 'import java.io.BufferedReader;',
            splicable: [`package ${packageName}.network;\n`]
        }, this);

        // Write package statement
        jhipsterUtils.rewriteFile({
            file: `${javaDir}/web/rest/RequestResource.java`,
            needle: 'import java.net.URI;',
            splicable: [`package ${packageName}.web.rest;\n`]
        }, this);

        // Write imports
        jhipsterUtils.rewriteFile({
            file: `${javaDir}network/request/A_BlockchainRequest.java`,
            needle: 'public abstract class A_BlockchainRequest {',
            splicable: [`import ${packageName}.network.CAClient;
import ${packageName}.network.ChannelClient;
import ${packageName}.network.Config;
import ${packageName}.network.FabricClient;
import ${packageName}.network.UserContext;
import ${packageName}.network.Util;\n`]
        }, this);

        // Write import
        jhipsterUtils.rewriteFile({
            file: `${javaDir}network/request/Add.java`,
            needle: `import org.hyperledger.fabric.sdk.ChaincodeID;`,
            splicable: [`import ${packageName}.network.Config;
import ${packageName}.network.networkException.EntityAlreadyExist;\n`]
        }, this);

        // Write import
        jhipsterUtils.rewriteFile({
            file: `${javaDir}network/request/Delete.java`,
            needle: 'public class Delete extends A_BlockchainRequest {',
            splicable: [`import ${packageName}.network.Config;
import ${packageName}.network.networkException.EntityNotFound;
import ${packageName}.network.networkException.StateAlreadySet;\n`]
        }, this);

        // Write import
        jhipsterUtils.rewriteFile({
            file: `${javaDir}network/request/Get.java`,
            needle: `import org.hyperledger.fabric.sdk.ProposalResponse;`,
            splicable: [`import ${packageName}.network.Config;
import ${packageName}.network.networkException.EntityNotFound;\n`]
        }, this);

        // Write import
        jhipsterUtils.rewriteFile({
            file: `${javaDir}network/request/Set.java`,
            needle: 'import org.hyperledger.fabric.sdk.ChaincodeID;',
            splicable: [`import ${packageName}.network.Config;
import ${packageName}.network.networkException.EntityNotFound;
import ${packageName}.network.networkException.StateAlreadySet;\n`]
        }, this);

        // Write Fabric SDK Maven dependency
        jhipsterUtils.rewriteFile({
            file: `build.gradle`,
            needle: '    //jhipster-needle-gradle-dependency - JHipster will add additional dependencies here',
            splicable: [`// https://mvnrepository.com/artifact/org.hyperledger.fabric-sdk-java/fabric-sdk-java\ncompile group: 'org.hyperledger.fabric-sdk-java', name: 'fabric-sdk-java', version: '1.4.0'`]
        }, this);

        // Import JDL
        shelljs.exec('jhipster import-jdl blockchain-jdl.jh');

        // Set log level to WARN
        jhipsterUtils.rewriteFile({
            file: `${resourceDir}logback-spring.xml`,
            needle: `    <logger name="sun.rmi.transport" level="WARN"/>`,
            splicable: [`<logger name="io" level="WARN"/>
<logger name="i.n.h.c.http2.Http2ConnectionHandler" level="WARN"/>\n`]}, this);

        // Write imports
        jhipsterUtils.rewriteFile({
            file: `${javaDir}web/rest/RequestResource.java`,
            needle: 'import io.github.jhipster.web.util.ResponseUtil;',
            splicable: [`import ${packageName}.domain.Request;
import ${packageName}.network.networkException.A_BlockchainException;
import ${packageName}.network.networkException.EntityNotFound;
import ${packageName}.network.request.Add;
import ${packageName}.network.request.Delete;
import ${packageName}.network.request.Get;
import ${packageName}.network.request.Set;
import ${packageName}.repository.RequestRepository;
import ${packageName}.web.rest.errors.BadRequestAlertException;
import ${packageName}.web.rest.util.HeaderUtil;\n`]
        }, this);

    }

    end() {
        this.log('End of blockchain generator');
    }
};
