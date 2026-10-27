import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../Apis/Services/ServerURL';

const fetchFaces = async (data, authToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/Face/faceGet`,
      {
        userData: data,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken || ''}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.data || response.data.length === 0) {
      throw new Error('No profile data found');
    }

    return response.data.data[0];
  } catch (error) {
    console.warn('Full error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      config: error.config,
    });

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      throw {
        message: error.message || 'API Error',
        status: status,
        isAxiosError: true,
      };
    } else {
      throw {
        message: 'Something went wrong',
        status: null,
        isAxiosError: false,
      };
    }
  }
};

const useFaceGet = (userdata, authToken) => {
  const [GetFacialImage, setGetFacialImage] = useState(null);
  const [GetFacialImageLoading, setGetFacialImageLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!userdata || !authToken) return;
    setGetFacialImageLoading(true);
    setError(null);
    try {
      const data = await fetchFaces(userdata, authToken);
      setGetFacialImage(data);
    } catch (err) {
      setError(err);
    } finally {
      setGetFacialImageLoading(false);
    }
  }, [userdata, authToken]);

  const GetFacialImageRefetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    GetFacialImage,
    GetFacialImageLoading,
    isError: !!error,
    error,
    GetFacialImageRefetching: GetFacialImageLoading,
    GetFacialImageRefetch,
  };
};

export default useFaceGet;
