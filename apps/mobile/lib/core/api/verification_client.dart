import 'dart:developer' as developer;
import 'api_error.dart';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/verification_models.dart';
import 'dio_client.dart';

class VerificationClient {
  final Dio _dio;

  VerificationClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  /// Get current user's verification status
  Future<VerificationStatusResponse> getVerificationStatus() async {
    try {
      final response = await _dio.get('/verification/status');

      if (response.data['success'] == true) {
        return VerificationStatusResponse.fromJson(response.data);
      }

      return VerificationStatusResponse(
        success: false,
        error: apiMessage(response.data) ?? 'Failed to fetch status',
      );
    } on DioException catch (e) {
      return VerificationStatusResponse(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationStatusResponse(success: false, error: e.toString());
    }
  }

  /// Get verification pricing (plans, free eligibility, campaigns)
  Future<VerificationPricingResponse?> getVerificationPricing() async {
    try {
      final response = await _dio.get('/verification/pricing');

      if (response.data['success'] == true && response.data['data'] != null) {
        return VerificationPricingResponse.fromJson(response.data['data']);
      }
      if (kDebugMode)
        developer.log(
          'No data in pricing response',
          name: 'VerificationClient',
        );
      return null;
    } catch (e) {
      if (kDebugMode)
        developer.log('Error fetching pricing: $e', name: 'VerificationClient');
      return null;
    }
  }

  /// Upload business verification document
  Future<VerificationUploadResponse> uploadBusinessDocument(File file) async {
    try {
      String fileName = file.path.split('/').last;
      FormData formData = FormData.fromMap({
        'business_license_document': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await _dio.post(
        '/verification/business/upload',
        data: formData,
      );

      if (response.data['success'] == true) {
        return VerificationUploadResponse.fromJson(response.data);
      }

      return VerificationUploadResponse(
        success: false,
        error: apiMessage(response.data) ?? 'Upload failed',
      );
    } on DioException catch (e) {
      return VerificationUploadResponse(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationUploadResponse(success: false, error: e.toString());
    }
  }

  /// Upload individual verification documents
  Future<VerificationUploadResponse> uploadIndividualDocuments({
    required File idFront,
    File? idBack,
    required File selfie,
    String idType = 'citizenship',
  }) async {
    try {
      final Map<String, dynamic> fileMap = {};

      fileMap['id_document_front'] = await MultipartFile.fromFile(
        idFront.path,
        filename: idFront.path.split('/').last,
      );

      if (idBack != null) {
        fileMap['id_document_back'] = await MultipartFile.fromFile(
          idBack.path,
          filename: idBack.path.split('/').last,
        );
      }

      fileMap['selfie_with_id'] = await MultipartFile.fromFile(
        selfie.path,
        filename: selfie.path.split('/').last,
      );

      FormData formData = FormData.fromMap(fileMap);

      final response = await _dio.post(
        '/verification/individual/upload',
        data: formData,
      );

      if (response.data['success'] == true) {
        return VerificationUploadResponse.fromJson(response.data);
      }

      return VerificationUploadResponse(
        success: false,
        error: apiMessage(response.data) ?? 'Upload failed',
      );
    } on DioException catch (e) {
      return VerificationUploadResponse(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationUploadResponse(success: false, error: e.toString());
    }
  }

  /// Submit business verification request
  Future<VerificationSubmitResponse> submitBusinessVerification({
    required String businessName,
    required String licenseDocument,
    String? documentType,
    String? documentNumber,
    int? durationDays,
    String? paymentStatus,
    double? paymentAmount,
    String? paymentReference,
  }) async {
    try {
      final data = {
        'businessName': businessName,
        'licenseDocument': licenseDocument,
        if (documentType != null) 'documentType': documentType,
        if (documentNumber != null) 'documentNumber': documentNumber,
        if (durationDays != null) 'durationDays': durationDays,
        if (paymentStatus != null) 'paymentStatus': paymentStatus,
        if (paymentAmount != null) 'paymentAmount': paymentAmount,
        if (paymentReference != null) 'paymentReference': paymentReference,
      };

      final response = await _dio.post('/verification/business', data: data);

      if (response.data['success'] == true) {
        return VerificationSubmitResponse.fromJson(response.data);
      }

      return VerificationSubmitResponse(
        success: false,
        error: apiMessage(response.data) ?? 'Submission failed',
      );
    } on DioException catch (e) {
      return VerificationSubmitResponse(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationSubmitResponse(success: false, error: e.toString());
    }
  }

  /// Submit individual verification request
  Future<VerificationSubmitResponse> submitIndividualVerification({
    required Map<String, dynamic> documentUrls,
    required String fullName,
    required String idType, // 'citizenship', 'passport', 'driving_license'
    required String idNumber,
    int? durationDays,
    String? paymentStatus,
    double? paymentAmount,
    String? paymentReference,
  }) async {
    try {
      final data = {
        'documentUrls': documentUrls,
        'fullName': fullName,
        'idDocumentType': idType,
        'idDocumentNumber': idNumber,
        if (durationDays != null) 'durationDays': durationDays,
        if (paymentStatus != null) 'paymentStatus': paymentStatus,
        if (paymentAmount != null) 'paymentAmount': paymentAmount,
        if (paymentReference != null) 'paymentReference': paymentReference,
      };

      final response = await _dio.post('/verification/individual', data: data);

      if (response.data['success'] == true) {
        return VerificationSubmitResponse.fromJson(response.data);
      }

      return VerificationSubmitResponse(
        success: false,
        error: apiMessage(response.data) ?? 'Submission failed',
      );
    } on DioException catch (e) {
      return VerificationSubmitResponse(
        success: false,
        error: apiMessage(e.response?.data) ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationSubmitResponse(success: false, error: e.toString());
    }
  }
}
