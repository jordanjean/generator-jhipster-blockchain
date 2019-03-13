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

import io.github.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing Request.
 */
@RestController
@RequestMapping("/api")
public class RequestResource {

	private final Logger log = LoggerFactory.getLogger(RequestResource.class);

	private static final String ENTITY_NAME = "request";

	private final RequestRepository requestRepository;

	public RequestResource(RequestRepository requestRepository) {
		this.requestRepository = requestRepository;
	}

	/**
	 * POST /requests : Create a new request.
	 *
	 * @param request the request to create
	 * @return the ResponseEntity with status 201 (Created) and with body the new
	 *         request, or with status 400 (Bad Request) if the request has already
	 *         an ID
	 * @throws URISyntaxException if the Location URI syntax is incorrect
	 */
	@PostMapping("/requests")
	public ResponseEntity<Request> createRequest(@RequestBody Request request) throws URISyntaxException {
		log.debug("REST request to save Request : {}", request);
		if (request.getId() != null) {
			throw new BadRequestAlertException("A new request cannot already have an ID", ENTITY_NAME, "idexists");
		}

		ResponseEntity<String> response = null;

		// Process blockchain operations
		switch (request.getType().name()) {

		// Process add request
		case "ADDITION":
			response = addRequest(request.getKey(), request.getValue());
			break;

		// Process delete request
		case "DELETION":
			response = deleteRequest(request.getKey());
			break;

		// Process set request
		case "SET":
			response = setRequest(request.getKey(), request.getValue());
			break;

		// Process get request
		case "GET":
			response = getRequest(request.getKey());
			// Set the entity value
			request.setValue(response.getBody());
			break;

		// Should not happen
		default:
			log.debug("Unknown request type.");
		}

		// Set the request status and save it
		request.setStatus(response.getStatusCode().toString());
		Request result = requestRepository.save(request);

		return ResponseEntity.created(new URI("/api/requests/" + result.getId()))
				.headers(HeaderUtil.createEntityCreationAlert(ENTITY_NAME, result.getId().toString())).body(result);
	}

	/**
	 * PUT /requests : Updates an existing request.
	 *
	 * @param request the request to update
	 * @return the ResponseEntity with status 200 (OK) and with body the updated
	 *         request, or with status 400 (Bad Request) if the request is not
	 *         valid, or with status 500 (Internal Server Error) if the request
	 *         couldn't be updated
	 * @throws URISyntaxException if the Location URI syntax is incorrect
	 */
	@PutMapping("/requests")
	public ResponseEntity<Request> updateRequest(@RequestBody Request request) throws URISyntaxException {
		log.debug("REST request to update Request : {}", request);
		if (request.getId() == null) {
			throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
		}
		Request result = requestRepository.save(request);
		return ResponseEntity.ok().headers(HeaderUtil.createEntityUpdateAlert(ENTITY_NAME, request.getId().toString()))
				.body(result);
	}

	/**
	 * GET /requests : get all the requests.
	 *
	 * @return the ResponseEntity with status 200 (OK) and the list of requests in
	 *         body
	 */
	@GetMapping("/requests")
	public List<Request> getAllRequests() {
		log.debug("REST request to get all Requests");
		return requestRepository.findAll();
	}

	/**
	 * GET /requests/:id : get the "id" request.
	 *
	 * @param id the id of the request to retrieve
	 * @return the ResponseEntity with status 200 (OK) and with body the request, or
	 *         with status 404 (Not Found)
	 */
	@GetMapping("/requests/{id}")
	public ResponseEntity<Request> getRequest(@PathVariable Long id) {
		log.debug("REST request to get Request : {}", id);
		Optional<Request> request = requestRepository.findById(id);
		return ResponseUtil.wrapOrNotFound(request);
	}

	/**
	 * DELETE /requests/:id : delete the "id" request.
	 *
	 * @param id the id of the request to delete
	 * @return the ResponseEntity with status 200 (OK)
	 */
	@DeleteMapping("/requests/{id}")
	public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
		log.debug("REST request to delete Request : {}", id);
		requestRepository.deleteById(id);
		return ResponseEntity.ok().headers(HeaderUtil.createEntityDeletionAlert(ENTITY_NAME, id.toString())).build();
	}

	/**
	 * POST /requests/add : add a new value to the blockchain.
	 *
	 * @param value the hash of the diploma we want to add to the BC
	 * @return the ResponseEntity with status 200 (OK) and the transaction ID, or
	 *         with status 417 (EXPECTATION_FAILED), or with status 500
	 *         (INTERNAL_SERVER_ERROR)
	 */
	@PostMapping("/requests/add")
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
	 * GET /requests/get : Get an entity value from the blockchain
	 *
	 * @param entity the entity to query
	 * @return the ResponseEntity with status 200 (OK) and the value of the entity,
	 *         or with status 417 (EXPECTATION_FAILED), or with status 500
	 *         (INTERNAL_SERVER_ERROR)
	 */
	@GetMapping("/requests/get")
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
	 * DELETE /requests/delete : delete an entity from the blockchain.
	 *
	 * @param entity to delete from the blockchain
	 * @return the ResponseEntity with status 200 (OK) and the transaction ID, or
	 *         with status 417 (EXPECTATION_FAILED), or with status 500
	 *         (INTERNAL_SERVER_ERROR)
	 */
	@DeleteMapping("/requests/delete")
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
	 * POST /requests/set : set an entity in the blockchain.
	 *
	 *
	 * @param entity the entity to add to the blockchain
	 * @param value  the value to set the entity to
	 * @return the ResponseEntity with status 200 (OK) and the transaction ID, or
	 *         with status 417 (EXPECTATION_FAILED), or with status 500
	 *         (INTERNAL_SERVER_ERROR)
	 */
	@PostMapping("/requests/set")
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

}
