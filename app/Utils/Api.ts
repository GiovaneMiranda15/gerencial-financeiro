import axios from "axios"

const api = async (options: any) => {
    try {
        const response = await axios.request(options)
        return response.data
    } catch (error) {
        return error
    }
}

export default api