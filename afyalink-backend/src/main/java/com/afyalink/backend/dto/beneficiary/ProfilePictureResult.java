package com.afyalink.backend.dto.beneficiary;

import org.springframework.http.MediaType;

public record ProfilePictureResult(byte[] data, MediaType contentType) {}
