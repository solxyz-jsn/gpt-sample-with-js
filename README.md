# JavaScriptを利用したOpenAI APIサンプル<!-- omit in toc -->

JavaScriptでの実装方法をいくつか紹介します。

## 環境準備

事前にJavaScriptはインストールされているものとします。

JavaScriptの基礎知識はSOLXYZ Academy「[JavaScript基礎](https://academy.solxyz.co.jp/web/javascript-basic/list)」で学ぶことができます。

他にも[公式ドキュメント](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference)や[JavaScript Primer](https://jsprimer.net/intro/)で学習してください。

### リポジトリのクローン

```PowerShell
git clone https://github.com/solxyz-jsn/gpt-sample-with-js.git
```

以降は本リポジトリ内の操作です。プロジェクトフォルダ内に移動します。

```PowerShell
cd gpt-sample-with-js
```

### 利用ライブラリのインストール

```PowerShell
npm i
```

※事前に[Node.js](https://nodejs.org/ja)をダウンロードしてください。

### .envファイルの作成

```PowerShell
New-Item ./.env
```

### Open AIのアクセスキーの設定

作成された`.env`ファイルを開き、以下を保存します。

```.env
OPENAI_API_KEY='あなたのアクセスキー'
```

## 実行方法

### シンプルな例

[SimpleQuery.js](./src/SimpleQuery.js)

Open AIのAPIを利用して回答を取得します。

```powershell
> node src/SimpleQuery.js

和訳したい文章を入力してください。（終了する場合はexit）

Hello World
和訳: こんにちは、世界

和訳したい文章を入力してください。（終了する場合はexit）

Good Morning
和訳: おはようございます

和訳したい文章を入力してください。（終了する場合はexit）

```

引数のqueryを翻訳対象としてプロンプトを生成し、結果を表示しています。

```JavaScript
export const run = async (query) => {
    // LLMの準備
    const llm = new OpenAI({modelName: "gpt-3.5-turbo", temperature: 0.9});

    // 入力内容を日本語に翻訳
    const res = await llm.call(
        `日本語に翻訳してください: ${query}`
    );
    console.log(`和訳: ${res}`);
};
```

### 外部データの活用（Embeddings）

[Embeddings.js](./src/Embeddings.js)

このサンプルでは[Embeddings](https://platform.openai.com/docs/guides/embeddings)を用いて外部データを利用します。

※Embeddingsとは自然言語処理の文脈で用いられる用語で、「単語や文章をベクトル化」（つまりN次元の空間に"埋め込み"をする）という意味です。

※本資料での`Embeddings`は自然言語処理の用語ではなく、OpenAI APIの機能としての`Embeddings`を指します。これは単語や文章を渡すとベクトル化した結果を返してくれるAPIです。
（OpenAI APIのEmbeddingsでは、単語や文章を1536次元のベクトルに変換します）

初回実行時には次の箇所のコメントを解除して利用します。initメソッドではインデックスの生成を行っています。

```JavaScript
// インデックスファイルを生成する（初回だけ実行）
await init();
```

```JavaScript
/**
 * インデックスファイルをローカルフォルダに生成する
 */
export const init = async () => {
        // テキストからインデックスを生成する
        const vectorStore = await FaissStore.fromTexts(
            ["Hello world", "I'm Kevin", "this is yummy"],
            [{id: 1}, {id: 2}, {id: 3}],
            new OpenAIEmbeddings()
        );

        // 生成したインデックスをファイル保存する
        await vectorStore.save(directory);
    }
```

コメントを解除して保存したら次のように実行します。

```powershell
>node src/Embeddings.js
インデックスをローカルに保存しました。

検索内容を入力してください。（終了する場合はexit）
```

一度実施をすると、`storage`フォルダーに`.json`ファイルおよび`.index`ファイルが作成され、再利用できます。（コメントを戻してください）

元のデータを更新した際には再実行が必要です。

文章を入力すると、次の3つの文章のうち最も近い内容のものを表示します。
- "Hello world"
- "I'm Kevin"
- "This is tasty"

### Function calling

Function callingを利用すると、自分で定義した関数を組み込んでGPTとやり取りが行えます。

[FunctionCalling.js](./src/FunctionCalling.js)

ここでは[クラスメソッド社の記事 - OpenAI APIのFunction calling機能でGPTに検索結果に基づいた回答をさせてみる](https://dev.classmethod.jp/articles/function-calling-blog-search-and-answer/)を参考にソルクシーズ公認ブログを検索して、要約する画面を作成します。

※本記事はPythonで実装しています。記事と同様の環境で試す場合は[Pythonのサンプル](#)をご参照ください。

#### APIキーの取得と設定

本サンプルを利用するためにはSerpApiのAPIキーの取得が必要です。

[SerpApi](https://serpapi.com/users/sign_up)で登録を行うと、月100回まで無料で検索を利用できます。

APIキーを取得したら、`.env`ファイルを開き、以下を保存します。

```.env
SERPAPI_API_KEY='あなたのアクセスキー'
```

本サンプルでは次の2つの関数を作成しています。

- ブログから入力に一致するURLを取得する`searchBlog`
- ブログの内容をパースする`getBlogContents`

function定義をJSONで渡してあげることで、APIが必要な関数を選んで応答してきます。

応答された関数名と引数から関数を呼び出して、再びAPIに渡します。

動作の詳細は元記事を参照してください。

次のように実行します。

```powershell
> node src/FunctionCalling.js

キーワードを入力してください。キーワードに基づいてソルクシーズ公認ブログの情報をまとめます（終了する場合はexit）

新人研修
新人研修について情報を取得中です...
answer ソルクシーズ公認ブログの検索結果から、以下の3つの記事を取得しました。

1. [新人研修奮闘記 第2回](https://solxyz-blog.info/member/worker/37287/): 2022年入社の新人たちのプログラミング研修の奮闘記です。未経験からの学習やグループ演習での成長について語られています。

2. [新人研修奮闘記 第1回](https://solxyz-blog.info/member/worker/37283/): 2022年新入社員の研修奮闘記です。2人の女性社員がそれぞれの研修の難しさや成長を語っています。

3. [2021年新入社員インタビュー 第2回](https://solxyz-blog.info/industry/itengineer/35777/): 2021年入社の新入社員のインタビュー記事です。理学部出身の社員がプログラミングの基礎を学び、実務での仕事に取り組む様子が描かれています。

これらの記事から、新人研修の内容や新入社員の成長についての情報が得られます。

```

検索ワードを入力すると、ブログを検索し、要約した結果を表示します。

注意: 本サンプルではトークンを大量に使用します。これは記事の内容をプロンプトに入れて問い合わせするということを何度か繰り返しているためです。過剰に実行してトークン使用量が膨大にならないようにご注意ください。
