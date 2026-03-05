import { useState } from 'react';
import { api } from '../utils/api';

export function useClassify() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  async function classifyImage(file) {
    setLoading(true);
    setError(null);
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      const data = await api.classifyImageFile(file);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function classifyVoice(transcript) {
    setLoading(true);
    setError(null);
    setImageFile(null);
    setImagePreview(null);

    try {
      const data = await api.classifyVoice(transcript);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setLoading(false);
  }

  return {
    result,
    loading,
    error,
    imageFile,
    imagePreview,
    classifyImage,
    classifyVoice,
    setResult,
    reset,
  };
}
