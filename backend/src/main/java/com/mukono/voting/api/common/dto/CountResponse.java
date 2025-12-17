package com.mukono.voting.api.common.dto;

/**
 * Simple count response for admin operations.
 */
public class CountResponse {
    private long count;

    public CountResponse(long count) {
        this.count = count;
    }

    public long getCount() {
        return count;
    }
}
