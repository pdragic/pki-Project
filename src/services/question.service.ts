import axios from "axios";

export class QuestionService {
    static async getAll() {
        return await axios.request({
            url: 'https://rasa.singidunum.ac.rs/api/question/category/upis',
            method: 'GET',
            headers: {
                'X-Token': '70b58a3d-4771-4092-8d01-2dcd08e5ad90'
            }
        })
    }
}