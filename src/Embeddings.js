import dotenv from "dotenv";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {FaissStore} from "langchain/vectorstores/faiss";
import readline from "readline";

// 環境変数の読み込み
dotenv.config();

// インデックスを保存するディレクトリ
const directory = "./storage";

/**
 * queryをembeddingし、ベクトルDBから最も類似なデータを表示する
 * @param query 検索内容
 */
export const run = async (query) => {
    // embeddingsのインスタンスを作成
    // 環境変数（OpenAI API Key）は自動で読み込まれる
    const embeddings = new OpenAIEmbeddings();

    // ローカルファイルからインデックスを取得する
    const loadedVectorStore = await FaissStore.load(
        directory,
        new OpenAIEmbeddings()
    );

    // 検索内容をベクトル検索する
    // 処理内訳: OpenAI APIを使用してqueryをembedding -> embedding結果とベクトルDBを比較
    const result = await loadedVectorStore.similaritySearch(query, 1);

    console.log(result);
}

/**
 * インデックスファイルをローカルフォルダに生成する
 */
export const init = async () => {
    // テキストからインデックスを生成する
    const vectorStore = await FaissStore.fromTexts(
        ["Hello world", "I'm Kevin", "This is tasty"],
        [{id: 1}, {id: 2}, {id: 3}],
        new OpenAIEmbeddings()
    );

    // 生成したインデックスをファイル保存する
    await vectorStore.save(directory);

    console.log("インデックスをローカルに保存しました。")
}

// インデックスファイルを生成する（初回だけ実行）
await init();

const cui = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`\n検索内容を入力してください。（終了する場合はexit）\n`);

cui.on('line', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
        cui.close();
    } else {
        const result = await run(input);
        console.log(`\n検索内容を入力してください。（終了する場合はexit）\n`);
    }
});

cui.on('close', () => {
    console.log('終了します。');
    process.exit(0);
});