package com.mukono.voting.backend.integration.helper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

/**
 * Helper for JSON response assertions in integration tests.
 */
public class JsonAssertionHelper {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Assert ApiErrorResponse structure.
     */
    public static void assertApiError(MvcResult result, int expectedStatus, String expectedError) throws Exception {
        String content = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(content);

        assertThat(root.has("timestamp"), is(true));
        assertThat(root.has("status"), is(true));
        assertThat(root.get("status").asInt(), equalTo(expectedStatus));
        assertThat(root.has("error"), is(true));
        assertThat(root.get("error").asText(), equalTo(expectedError));
        assertThat(root.has("message"), is(true));
        assertThat(root.has("path"), is(true));
    }

    /**
     * Assert EligibilityDecisionResponse structure.
     */
    public static void assertEligibilityResponse(MvcResult result, boolean eligible, String rule) throws Exception {
        String content = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(content);

        assertThat(root.has("eligible"), is(true));
        assertThat(root.get("eligible").asBoolean(), equalTo(eligible));
        assertThat(root.has("rule"), is(true));
        assertThat(root.get("rule").asText(), equalTo(rule));
        assertThat(root.has("reason"), is(true));
    }

    /**
     * Assert VoteResponse structure.
     */
    public static void assertVoteResponse(MvcResult result, Long electionId, Long positionId, String status) throws Exception {
        String content = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(content);

        assertThat(root.has("voteId"), is(true));
        assertThat(root.has("electionId"), is(true));
        assertThat(root.get("electionId").asLong(), equalTo(electionId));
        assertThat(root.has("positionId"), is(true));
        assertThat(root.get("positionId").asLong(), equalTo(positionId));
        assertThat(root.has("candidateId"), is(true));
        assertThat(root.has("voterId"), is(true));
        assertThat(root.has("status"), is(true));
        assertThat(root.get("status").asText(), equalTo(status));
        assertThat(root.has("castAt"), is(true));
    }

    /**
     * Assert PositionTallyResponse structure.
     */
    public static void assertPositionTallyResponse(MvcResult result, Long electionId, Long positionId) throws Exception {
        String content = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(content);

        assertThat(root.has("electionId"), is(true));
        assertThat(root.get("electionId").asLong(), equalTo(electionId));
        assertThat(root.has("positionId"), is(true));
        assertThat(root.get("positionId").asLong(), equalTo(positionId));
        assertThat(root.has("items"), is(true));
        assertThat(root.get("items").isArray(), is(true));
        assertThat(root.has("totalVotes"), is(true));
    }

    /**
     * Assert WinnerResponse structure (no tie).
     */
    public static void assertWinnerResponse(MvcResult result, boolean isTie) throws Exception {
        String content = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(content);

        assertThat(root.has("tie"), is(true));
        assertThat(root.get("tie").asBoolean(), equalTo(isTie));
        assertThat(root.has("topCandidateIds"), is(true));
        assertThat(root.get("topCandidateIds").isArray(), is(true));
        assertThat(root.has("topVotes"), is(true));
    }

    /**
     * Assert PagedResponse structure.
     */
    public static void assertPagedResponse(MvcResult result, int expectedPage, int expectedSize) throws Exception {
        String content = result.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(content);

        assertThat(root.has("content"), is(true));
        assertThat(root.get("content").isArray(), is(true));
        assertThat(root.has("page"), is(true));
        assertThat(root.get("page").asInt(), equalTo(expectedPage));
        assertThat(root.has("size"), is(true));
        assertThat(root.get("size").asInt(), equalTo(expectedSize));
        assertThat(root.has("totalElements"), is(true));
        assertThat(root.has("totalPages"), is(true));
        assertThat(root.has("last"), is(true));
    }

    /**
     * Extract JSON node from response.
     */
    public static JsonNode getJsonRoot(MvcResult result) throws Exception {
        String content = result.getResponse().getContentAsString();
        return objectMapper.readTree(content);
    }
}
