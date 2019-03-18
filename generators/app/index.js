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
        const done = this.async();
        const prompts = [
            {
                type: 'input',
                name: 'jdl',
                message: 'You should have imported a JDL to be able to manage entities on the blockchain. Enter the path of your JDL file to import it.',
                default: 'Do not import JDL'
            }
        ];

        this.prompt(prompts).then((props) => {
            this.jdl = props.jdl
            done();
        });
    }

    writing() {
        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this,
                null,
                { globOptions: { dot: true } }
            );
        };

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;
        this.databaseType = this.jhipsterAppConfig.databaseType;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        // Import JDL
        if (this.jdl !== 'Do not import JDL'){
            shelljs.exec(`jhipster import-jdl ${this.jdl}`);
        }

        // Write blockchain communication module package
        this.template('network', `${javaDir}network`);

        // Write fabric-network folder
        this.template('fabric-network', 'fabric-network');

        // Get entities in JSON format
        var json_entities = this.getExistingEntities();

        // Write resource file for each entity
        json_entities.forEach(entity => {
            this.template('template-file.java', `${javaDir}web/rest/${entity.name}Resource.java`);
        });
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

        // Check Gradle is used
        if (this.buildTool !== 'gradle'){
            this.log("ERROR: You must use Gradle as build tool to use this generator.");
            throw new Error("Gradle is not the build tool used here.")
        }

        // Check SQL is used
        if (this.databaseType !== 'sql'){
            this.log("ERROR: You must use SQL as database type to use this generator.");
            throw new Error("SQL is not the database type used here.")
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

        // Get entities in JSON format
        var json_entities = this.getExistingEntities();

        // Write resource file for each entity
        json_entities.forEach(entity => {
            this.log(`Writing ${entity.name} entity file`);

            var lowercase = `${entity.name}`.toLowerCase();

            // Write file content
            jhipsterUtils.rewriteFile({
                file: `${javaDir}web/rest/${entity.name}Resource.java`,
                needle: '',
                splicable: [`package ${packageName}.web.rest;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ${packageName}.domain.${entity.name};
import ${packageName}.network.networkException.A_BlockchainException;
import ${packageName}.network.networkException.EntityNotFound;
import ${packageName}.network.request.Add;
import ${packageName}.network.request.Delete;
import ${packageName}.network.request.Get;
import ${packageName}.network.request.Set;
import ${packageName}.repository.${entity.name}Repository;
import ${packageName}.web.rest.errors.BadRequestAlertException;
import ${packageName}.web.rest.util.HeaderUtil;

import io.github.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing ${entity.name}.
 */
@RestController
@RequestMapping("/api")
public class ${entity.name}Resource {

    private final Logger log = LoggerFactory.getLogger(${entity.name}Resource.class);

    private static final String ENTITY_NAME = "${lowercase}";

    private final ${entity.name}Repository ${lowercase}Repository;

    public ${entity.name}Resource(${entity.name}Repository ${lowercase}Repository) {
        this.${lowercase}Repository = ${lowercase}Repository;
    }

    /**
     * POST /${lowercase}s : Create a new ${lowercase}.
     *
     * @param ${lowercase} the ${lowercase} to create
     * @return the ResponseEntity with status 201 (Created) and with body the new
     *         ${lowercase}, or with status 400 (Bad Request) if the ${lowercase} has already
     *         an ID
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PostMapping("/${lowercase}s")
    public ResponseEntity<${entity.name}> create${entity.name}(@RequestBody ${entity.name} ${lowercase}) throws URISyntaxException {
        log.debug("REST request to save ${entity.name} : {}", ${lowercase});
        if (${lowercase}.getId() != null) {
            throw new BadRequestAlertException("A new ${lowercase} cannot already have an ID", ENTITY_NAME, "idexists");
        }

        ${entity.name} result = ${lowercase}Repository.save(${lowercase});

        // Process blockchain add request
        log.debug("BLOCKCHAIN ADD: " + ${lowercase}.getId().toString() + " with the value: " + ${lowercase}.toString());
        ResponseEntity<String> response = addRequest(${lowercase}.getId().toString(), ${lowercase}.toString());
        log.debug("BLOCKCHAIN ADD RESPONSE: " + response);

        return ResponseEntity.created(new URI("/api/${lowercase}s/" + result.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString())).body(result);
    }

    /**
     * PUT /${lowercase}s : Updates an existing ${lowercase}.
     *
     * @param ${lowercase} the ${lowercase} to update
     * @return the ResponseEntity with status 200 (OK) and with body the updated
     *         ${lowercase}, or with status 400 (Bad Request) if the ${lowercase} is not
     *         valid, or with status 500 (Internal Server Error) if the ${lowercase}
     *         couldn't be updated
     * @throws URISyntaxException if the Location URI syntax is incorrect
     */
    @PutMapping("/${lowercase}s")
    public ResponseEntity<${entity.name}> update${entity.name}(@RequestBody ${entity.name} ${lowercase}) throws URISyntaxException {
        log.debug("REST request to update ${entity.name} : {}", ${lowercase});
        if (${lowercase}.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        // Process blockchain set request
        log.debug("BLOCKCHAIN UPDATE: " + ${lowercase}.getId().toString() + " to the value: " + ${lowercase}.toString());
        ResponseEntity<String> response = setRequest(${lowercase}.getId().toString(), ${lowercase}.toString());
        log.debug("BLOCKCHAIN UPDATE RESPONSE: " + response);

        ${entity.name} result = ${lowercase}Repository.save(${lowercase});
        return ResponseEntity.ok().headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, ${lowercase}.getId().toString()))
                .body(result);
    }

    /**
     * GET /${lowercase}s : get all the ${lowercase}s.
     *
     * @return the ResponseEntity with status 200 (OK) and the list of ${lowercase}s in
     *         body
     */
    @GetMapping("/${lowercase}s")
    public List<${entity.name}> getAll${entity.name}s() {
        log.debug("REST request to get all ${entity.name}s");
        return ${lowercase}Repository.findAll();
    }

    /**
     * GET /${lowercase}s/:id : get the "id" ${lowercase}.
     *
     * @param id the id of the ${lowercase} to retrieve
     * @return the ResponseEntity with status 200 (OK) and with body the ${lowercase}, or
     *         with status 404 (Not Found)
     */
    @GetMapping("/${lowercase}s/{id}")
    public ResponseEntity<${entity.name}> getRequest(@PathVariable Long id) {
        log.debug("REST request to get ${entity.name} : {}", id);
        Optional<${entity.name}> ${lowercase} = ${lowercase}Repository.findById(id);
        return ResponseUtil.wrapOrNotFound(${lowercase});
    }

    /**
     * DELETE /${lowercase}s/:id : delete the "id" ${lowercase}.
     *
     * @param id the id of the ${lowercase} to delete
     * @return the ResponseEntity with status 200 (OK)
     */
    @DeleteMapping("/${lowercase}s/{id}")
    public ResponseEntity<Void> delete${entity.name}(@PathVariable Long id) {
        log.debug("REST request to delete ${entity.name} : {}", id);

        // Process blockchain delete request
        log.debug("BLOCKCHAIN DELETE: " + id.toString());
        ResponseEntity<String> response = deleteRequest(id.toString());
        log.debug("BLOCKCHAIN DELETE RESPONSE: " + response);

        ${lowercase}Repository.deleteById(id);
        return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
    }

    /**
     * POST /${lowercase}s/add : add a new value to the blockchain.
     *
     * @param value the hash of the diploma we want to add to the BC
     * @return the ResponseEntity with status 200 (OK) and the transaction ID, or
     *         with status 417 (EXPECTATION_FAILED), or with status 500
     *         (INTERNAL_SERVER_ERROR)
     */
    @PostMapping("/${lowercase}s/add")
    public ResponseEntity<String> addRequest(@RequestParam String entity, String value) {
        if (entity.isEmpty()) {
            log.debug("Empty entity name");
            return new ResponseEntity<String>("EMPTY_ENTITY_NAME", HttpStatus.EXPECTATION_FAILED);
        }
        if (value.isEmpty()) {
            log.debug("Empty value");
            return new ResponseEntity<String>("EMPTY_VALUE", HttpStatus.EXPECTATION_FAILED);
        }

        Add blockchainRequest;
        String transactionID;
        try {
            blockchainRequest = new Add(entity, value);
            blockchainRequest.send();
            transactionID = blockchainRequest.transactionID;
        } catch (A_BlockchainException e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.NOT_ACCEPTABLE);
        } catch (Exception e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Create JSON string
        String returned = "{" + '"' + "transactionID" + '"' + ":" + '"' + transactionID + '"' + "}";
        return new ResponseEntity<String>(returned, HttpStatus.OK);
    }

    /**
     * GET /${lowercase}s/get : Get an entity value from the blockchain
     *
     * @param entity the entity to query
     * @return the ResponseEntity with status 200 (OK) and the value of the entity,
     *         or with status 417 (EXPECTATION_FAILED), or with status 500
     *         (INTERNAL_SERVER_ERROR)
     */
    @GetMapping("/${lowercase}s/get")
    public ResponseEntity<String> getRequest(@RequestParam String entity) {
        if (entity.isEmpty()) {
            log.debug("Empty entity name");
            return new ResponseEntity<String>("EMPTY_ENTITY_NAME", HttpStatus.EXPECTATION_FAILED);
        }

        String value = null;
        Get get;

        try {
            get = new Get(entity);
            get.send();
            value = get.state;
        } catch (EntityNotFound e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);

            // Create JSON string
            String returned = "{" + '"' + "entityState" + '"' + ":" + '"' + "NOT_FOUND" + '"' + "}";
            return new ResponseEntity<String>(returned, HttpStatus.OK);
        } catch (Exception e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (value == null) {
            log.debug("The query has failed");
            return new ResponseEntity<String>("QUERY FAILED", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        switch (value) {
        case "NOT_FOUND":
            // Create JSON string
            String returned = "{" + '"' + "entityState" + '"' + ":" + '"' + "NOT_FOUND" + '"' + "}";
            return new ResponseEntity<String>(returned, HttpStatus.OK);
        }

        // Create JSON string
        String returned = "{" + '"' + "entityState" + '"' + ":" + '"' + value + '"' + "}";
        return new ResponseEntity<String>(returned, HttpStatus.OK);
    }

    /**
     * DELETE /${lowercase}s/delete : delete an entity from the blockchain.
     *
     * @param entity to delete from the blockchain
     * @return the ResponseEntity with status 200 (OK) and the transaction ID, or
     *         with status 417 (EXPECTATION_FAILED), or with status 500
     *         (INTERNAL_SERVER_ERROR)
     */
    @DeleteMapping("/${lowercase}s/delete")
    public ResponseEntity<String> deleteRequest(@RequestParam String entity) {
        if (entity.isEmpty()) {
            log.debug("Empty entity name");
            return new ResponseEntity<String>("EMPTY_ENTITY_NAME", HttpStatus.EXPECTATION_FAILED);
        }

        Delete blockchainRequest;
        String transactionID;
        try {
            blockchainRequest = new Delete(entity);
            blockchainRequest.send();
            transactionID = blockchainRequest.transactionID;
        } catch (A_BlockchainException e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.NOT_ACCEPTABLE);
        } catch (Exception e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Create JSON string
        String returned = "{" + '"' + "transactionID" + '"' + ":" + '"' + transactionID + '"' + "}";
        return new ResponseEntity<String>(returned, HttpStatus.OK);
    }

    /**
     * POST /${lowercase}s/set : set an entity in the blockchain.
     *
     *
     * @param entity the entity to add to the blockchain
     * @param value  the value to set the entity to
     * @return the ResponseEntity with status 200 (OK) and the transaction ID, or
     *         with status 417 (EXPECTATION_FAILED), or with status 500
     *         (INTERNAL_SERVER_ERROR)
     */
    @PostMapping("/${lowercase}s/set")
    public ResponseEntity<String> setRequest(@RequestParam String entity, String value) {
        if (entity.isEmpty()) {
            log.debug("Empty entity name");
            return new ResponseEntity<String>("EMPTY_ENTITY_NAME", HttpStatus.EXPECTATION_FAILED);
        }
        if (value.isEmpty()) {
            log.debug("Empty value");
            return new ResponseEntity<String>("EMPTY_VALUE", HttpStatus.EXPECTATION_FAILED);
        }

        Set blockchainRequest;
        String transactionID;
        try {
            blockchainRequest = new Set(entity, value);
            blockchainRequest.send();
            transactionID = blockchainRequest.transactionID;
        } catch (A_BlockchainException e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.NOT_ACCEPTABLE);
        } catch (Exception e) {
            String errored = "BLOCKCHAIN ERROR: " + e.toString();
            log.debug(errored);
            return new ResponseEntity<String>(errored, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Create JSON string
        String returned = "{" + '"' + "transactionID" + '"' + ":" + '"' + transactionID + '"' + "}";
        return new ResponseEntity<String>(returned, HttpStatus.OK);
    }

}\n`]
            }, this);
        });

        // Set log level to WARN
        jhipsterUtils.rewriteFile({
            file: `${resourceDir}logback-spring.xml`,
            needle: `    <logger name="sun.rmi.transport" level="WARN"/>`,
            splicable: [`<logger name="io" level="WARN"/>
<logger name="i.n.h.c.http2.Http2ConnectionHandler" level="WARN"/>\n`]}, this);

        // Write description and Hyperledger section in readme
        jhipsterUtils.rewriteFile({
            file: `README.md`,
            needle: '## Development',
            splicable: ['This is a simple web application to manage entities on a blockchain using an Hyperledger Fabric network v1.4.\n\nWhen you create, update or delete entities using this sample application, requests are sent to the Hyperledger network to update the blockchain ledger. For this to happen, Hyperledger must be running.\n\n## Hyperledger\n\nTo run this application you will need to run Hyperledger. See the readme in `./fabric-network/README.md` to know how.\n']
        }, this);

    }

    end() {
        this.log('End of blockchain generator');
    }
};
