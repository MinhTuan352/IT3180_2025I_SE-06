import axiosClient from './axiosClient';

const importApi = {
    // Tải file mẫu
    exportMasterData: () => {
        return axiosClient.get('/import/export-master-data', { responseType: 'blob' });
    },

    // Import dữ liệu Master Data
    importMasterData: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axiosClient.post('/import/master-data', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default importApi;
