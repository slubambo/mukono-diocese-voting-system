package com.mukono.voting.payload.response.common;

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
