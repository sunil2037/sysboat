import { useMutation } from '@tanstack/react-query';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from './useEncodedUserData';
import { useAuth } from '../Context/AuthContext';
import { API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { useEffect, useState } from 'react';

const useUploadFile = () => {
    const { UploadFileToCloud } = useApi({ header: 'multipart/form-data', IP: API_BASE_URL2 });
    const { userdata } = useEncodedUserData();
    const { userAuthData } = useAuth();
    const [Success, setIsSuccess] = useState(false);
    const {
        mutate: uploadFile,
        isPending,
        isSuccess,
        error,
        data,
    } = useMutation({
        mutationFn: async ({ file, folder = 'default' }) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", 'company_' + userAuthData?.company_id + '/' + 'employee_' + userAuthData?.id + '/' + folder);
            formData.append("userData", userdata);
            return await UploadFileToCloud(formData);
        }
    });

    useEffect(() => {
        setIsSuccess(isSuccess);
    }, [isSuccess])


    return { uploadFile, isPending, isSuccessed: Success, setIsSuccess, error, data };
};

export default useUploadFile;
