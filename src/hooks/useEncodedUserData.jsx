import { useEffect, useState } from 'react';
import base64 from 'base-64';
import Storage from '../storage/NativeStorage';

export const storage = Storage;

const useEncodedUserData = () => {
  const [userdata, setUserdata] = useState(null);

  const load = async () => {
    const data = await Storage.getString('data');
    setUserdata(data ? base64.encode(data) : null);
  };

  useEffect(() => {
    load();
  }, []);

  return { userdata, refresh: load };
};

export default useEncodedUserData;
