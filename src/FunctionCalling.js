import {Configuration, OpenAIApi} from "openai";
import dotenv from "dotenv";
import fetch from "node-fetch";
import {GoogleSearch} from 'google-search-results-nodejs';
import jsdom from "jsdom";
import readline from "readline";

const {JSDOM} = jsdom;

/**
 * Function Calling用の関数定義
 */
const functions = [
    {
        name: "getBlogContents",
        description: "指定したURLについてその内容を取得して、パースした結果のテキストを得る",
        parameters: {
            type: "object",
            properties: {
                targetUrl: {
                    type: "string",
                    description: "内容を取得したいページのURL",
                },
            },
            required: ["targetUrl"],
        },
    },
    {
        name: "searchBlog",
        description: "指定したキーワードでソルクシーズ公認ブログを検索して、URLのリストを得る。",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "検索キーワード",
                },
            },
            required: ["query"],
        },
    }
];

/**
 * OpenAIの使用モデル
 * @type {string}
 */
const MODEL_NAME = "gpt-3.5-turbo-16k-0613"

// 環境変数の読み込み
dotenv.config();

// APIコール用のインスタンスを作成
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// コマンドライン入力および出力を取得
const cui = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`\nキーワードを入力してください。キーワードに基づいてソルクシーズ公認ブログの情報をまとめます（終了する場合はexit）\n`);

// 入力時のイベント
cui.on('line', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
        cui.close();
    } else {
        console.log(`${input}について情報を取得中です...`);
        await run(input);

        console.log(`\nキーワードを入力してください。キーワードに基づいてソルクシーズ公認ブログの情報をまとめます（終了する場合はexit）\n`);
    }
});

// コマンドライン終了時のイベント
cui.on('close', () => {
    console.log('終了します。');
    process.exit(0);
});

/**
 * 入力内容をもとにソルクシーズ公認ブログの内容を検索してまとめる
 * @param prompt ブログから取得したい情報のキーワード
 */
const run = async (input) => {
    // promptを生成
    const prompt = `「${input}」について、まずソルクシーズ公認ブログを検索した結果のその上位3件を取得します。その後、それぞれのURLについてその内容を取得して、パースした結果のテキストを得ます。そしてそれらのパースした結果をまとめ、最終的な答えを１つ生成してください。`;
    // 最大のリクエスト数
    const MAX_REQUEST_COUNT = 10;
    // メッセージの履歴を初期化
    let message_history = [];
    for (let request_count = 0; request_count < MAX_REQUEST_COUNT; request_count++) {
        let function_call_mode = "auto";
        if (request_count === MAX_REQUEST_COUNT - 1) {
            function_call_mode = "none";
        }
        // OpenAIのAPIを実行
        // レスポンスはOpenAIのAPIから取得した結果を想定します
        let response = await openai.createChatCompletion({
            model: MODEL_NAME,
            messages: [
                {
                    role: "user",
                    content: prompt
                },
                ...message_history
            ],
            functions: functions,
            function_call: function_call_mode
        });

        // messageがfunction_callを含む場合
        if (response.data.choices[0].message.function_call) {
            let message = response.data.choices[0].message;
            message_history.push(message);
            let function_call = response.data.choices[0].message.function_call;
            let function_name = function_call.name;
            if (functions.map(x => x.name).includes(function_name)) {
                let function_arguments = Object.values(JSON.parse(function_call.arguments))[0];
                let function_response = await eval(function_name)(function_arguments);
                message = {
                    role: "function",
                    name: function_name,
                    content: function_response
                }
                message_history.push(message);
            } else {
                throw new Error("Function not found");
            }
            // messageがfunction_callを含まない場合は回答を表示
        } else {
            console.log("answer", response.data.choices[0].message.content.trim());
            break;
        }
    }
}


/**
 * 指定したキーワードでソルクシーズ公認ブログを検索して、URLのリストを得る。
 * @param query(str) 検索キーワード
 * @returns URLのリスト
 */
const searchBlog = async (query) => {
    const parameters = {
        q: `site:solxyz-blog.info ${query}`,
        location: "Tokyo,Japan",
        hl: "ja",
        gl: "jp",
        google_domain: "google.co.jp",
    };

    const search = new GoogleSearch(process.env.SERPAPI_API_KEY);

    return new Promise((resolve, reject) => {
        search.json(parameters, (result) => {
            if (result.organic_results) {
                let urls = result.organic_results.map(item => item.link).join(",");
                resolve(urls);
            } else {
                reject(new Error("No results found"));
            }
        });
    });
}

/**
 * 指定したURLのブログ記事の内容を取得する
 * @param url(str) ブログ記事のURL
 * @returns ブログ記事の内容
 */
const getBlogContents = async (url) => {
    const res = await fetch(url);
    const body = await res.text(); // HTMLをテキストで取得
    const dom = new JSDOM(body); // パース
    const content = dom.window.document.getElementsByClassName("content")[0];
    const texts = Array.from(content.getElementsByTagName('p')).map(p => p.textContent);
    // console.log("texts", texts.join("\n").substring(0, 4000)); // デバッグ用（取得した記事の内容をコンソール表示）
    return texts.join("\n").substring(0, 4000);
};