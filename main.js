import { JSONLoader } from "langchain/document_loaders/fs/json";

const loader = new JSONLoader("./Jobs.json");

const docs = await loader.load();
