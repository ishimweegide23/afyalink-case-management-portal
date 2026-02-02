package com.afyalink.backend.dto.common;

import org.springframework.http.MediaType;

public record ProfilePictureResult(byte[] data, MediaType contentType) {}
