import dotenv from "dotenv";
import {OpenAI} from "langchain/llms/openai";
import readline from 'readline';

// 環境変数の読み込み
dotenv.config();

/**
 * gpt-3.5モデルに単発の問い合わせをする
 * @param query 問い合わせ内容
 */
export const run = async (query) => {
    // LLMの準備
    const llm = new OpenAI({modelName: "gpt-3.5-turbo", temperature: 0.9});

    // 入力内容を日本語に翻訳
    const res = await llm.call(
        `日本語に翻訳してください: ${query}`
    );
    console.log(`和訳: ${res}`);
};

const cui = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`\n和訳したい文章を入力してください。（終了する場合はexit）\n`);

cui.on('line', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
        cui.close();
    } else {
        const result = await run(input);
        console.log(`\n和訳したい文章を入力してください。（終了する場合はexit）\n`);
    }
});

cui.on('close', () => {
    console.log('終了します。');
    process.exit(0);
});