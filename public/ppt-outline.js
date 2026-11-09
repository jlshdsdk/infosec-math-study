'use strict';

// 正式目录逐项依据课件章首页与原小节标题；内部 key 不是课件编号。
// parts 仅将已存在的完整讲解定位到相关段落；原 lesson ID、原页与学习记录保持不变。
window.PPT_OUTLINE = {
  "1": {
    "title": "整数的可除性",
    "intro": "1-intro",
    "home": {
      "source": "lesson-33847191",
      "page": 8,
      "asset": "709a261d11e44f36268c"
    },
    "sections": [
      {
        "key": "1.1",
        "number": "1.1",
        "title": "整除的概念 欧几里得除法",
        "chapter": "1",
        "section": "1.1",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33847191",
            "page": 10,
            "asset": "94968bca10e1d347a28a"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "1.1.1",
            "number": "1.1.1",
            "title": "整除基本概念及性质",
            "chapter": "1",
            "section": "1.1",
            "parts": [
              {
                "lesson": "div",
                "anchor": "1-1-1-1"
              },
              {
                "lesson": "prime",
                "until": "### 只试到平方根\n若正合数 $n=uv$，可以取 $1<u\\le v$，所以 $u^2\\le n$。取 $n$ 的所有“大于 $1$ 的正因数”中最小的一个 $p$；若 $p$",
                "label": "素数与合数的定义",
                "anchor": "1-1-1-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 10,
                "asset": "94968bca10e1d347a28a"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 11,
                "asset": "d1735ad5a4b3f8a0f433"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.1.2",
            "number": "1.1.2",
            "title": "素数的求法（Eratosthenes筛法）",
            "chapter": "1",
            "section": "1.1",
            "parts": [
              {
                "lesson": "prime",
                "from": "### 筛法与素数无穷性\nEratosthenes 筛法从 2 开始保留未划去的数，划去它的倍数，直到处理完不超过 $\\sqrt N$ 的素数。课件展示了 100 以内的筛选。",
                "until": "假设只有素数 $p_1,\\ldots,p_k$，令 $N=p_1\\cdots p_k+1$。N 有一个素因数，却不被任何已列的 $p_i$ 整除，矛盾。这里不需要断言 N 自身一定",
                "label": "Eratosthenes筛法",
                "anchor": "1-1-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 10,
                "asset": "94968bca10e1d347a28a"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 217,
                "asset": "b1d0feaf1741df5c256b"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          },
          {
            "key": "1.1.3",
            "number": "1.1.3",
            "title": "欧几里得除法——最小非负余数",
            "chapter": "1",
            "section": "1.1",
            "parts": [
              {
                "lesson": "division",
                "anchor": "1-1-3-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 10,
                "asset": "94968bca10e1d347a28a"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 79,
                "asset": "cd0bd24368a0a2bbba2e"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.1.4",
            "number": "1.1.4",
            "title": "素数的平凡判别",
            "chapter": "1",
            "section": "1.1",
            "parts": [
              {
                "lesson": "prime",
                "from": "### 只试到平方根\n若正合数 $n=uv$，可以取 $1<u\\le v$，所以 $u^2\\le n$。取 $n$ 的所有“大于 $1$ 的正因数”中最小的一个 $p$；若 $p$",
                "until": "### 筛法与素数无穷性\nEratosthenes 筛法从 2 开始保留未划去的数，划去它的倍数，直到处理完不超过 $\\sqrt N$ 的素数。课件展示了 100 以内的筛选。",
                "label": "平方根试除判别",
                "anchor": "1-1-4-1"
              },
              {
                "lesson": "prime",
                "from": "假设只有素数 $p_1,\\ldots,p_k$，令 $N=p_1\\cdots p_k+1$。N 有一个素因数，却不被任何已列的 $p_i$ 整除，矛盾。这里不需要断言 N 自身一定",
                "label": "素数无穷性",
                "anchor": "1-1-4-2"
              },
              {
                "lesson": "prime-form",
                "anchor": "1-1-4-3"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 10,
                "asset": "94968bca10e1d347a28a"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 212,
                "asset": "80ffa028f766246b7a52"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          },
          {
            "key": "1.1.5",
            "number": "1.1.5",
            "title": "欧几里得除法——一般余数",
            "chapter": "1",
            "section": "1.1",
            "parts": [
              {
                "lesson": "remainder",
                "anchor": "1-1-5-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 10,
                "asset": "94968bca10e1d347a28a"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 122,
                "asset": "12c946faa6b2df02b3c5"
              },
              {
                "source": "lesson-33847191",
                "page": 127,
                "asset": "9b26a7b03fe5ac81c929"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "1.2",
        "number": "1.2",
        "title": "整数的表示",
        "chapter": "1",
        "section": "1.2",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33847191",
            "page": 265,
            "asset": "732a7706f7f909ee393e"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "1.2.1",
            "number": "1.2.1",
            "title": "b进制",
            "chapter": "1",
            "section": "1.2",
            "parts": [
              {
                "lesson": "base",
                "anchor": "1-2-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 265,
                "asset": "732a7706f7f909ee393e"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 267,
                "asset": "8013ab77d343294e4114"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.2.2",
            "number": "1.2.2",
            "title": "计算复杂性",
            "readingStatus": "toc_only",
            "readingLabel": "仅找到目录原页，正文待核查",
            "chapter": "1",
            "section": "1.2",
            "parts": [],
            "note": "现阶段仅在1.2小节目录中明确找到本标题，独立正文及对应讲解仍待核查。下方是目录原页，不代表本项已有完整正文；不依据帧数推定正文所在位置。",
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 265,
                "asset": "732a7706f7f909ee393e"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 265,
                "asset": "732a7706f7f909ee393e"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          }
        ]
      },
      {
        "key": "1.3",
        "number": "1.3",
        "title": "最大公因数与广义欧几里得除法",
        "chapter": "1",
        "section": "1.3",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33847191",
            "page": 321,
            "asset": "d8ce673b97b53a168097"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "1.3.1",
            "number": "1.3.1",
            "title": "最大公因数",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "gcd",
                "anchor": "1-3-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 322,
                "asset": "0250124ae69e5ab360e1"
              },
              {
                "source": "lesson-33907436",
                "page": 4,
                "asset": "348ef80d6b3063f582aa"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.3.2",
            "number": "1.3.2",
            "title": "广义欧几里得除法及计算最大公因数",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "euclid",
                "anchor": "1-3-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 410,
                "asset": "175513b72af67adfdec7"
              },
              {
                "source": "lesson-33907436",
                "page": 92,
                "asset": "70885078bc88119f314f"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.3.3",
            "number": "1.3.3",
            "title": "Bézout等式",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "bezout",
                "anchor": "1-3-3-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 456,
                "asset": "075401f6b6078df9a979"
              },
              {
                "source": "lesson-33907436",
                "page": 138,
                "asset": "3fb3057d8cf1f48a789c"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.3.4",
            "number": "1.3.4",
            "title": "Bézout等式的递推求解式及其证明",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "extended",
                "anchor": "1-3-4-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 475,
                "asset": "64fef67570f5c497b233"
              },
              {
                "source": "lesson-33907436",
                "page": 157,
                "asset": "c2ddbbc8a41f8ca46d60"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.3.5",
            "number": "1.3.5",
            "title": "最大公因数的进一步性质",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "gcd-props",
                "anchor": "1-3-5-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 595,
                "asset": "358c8dd10b4e3e285d21"
              },
              {
                "source": "lesson-33907436",
                "page": 277,
                "asset": "f0f58c997ee2a25a650b"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.3.6",
            "number": "1.3.6",
            "title": "多个整数的最大公因数及计算",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "multi-gcd",
                "anchor": "1-3-6-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 661,
                "asset": "1c3d28c9d039da48e35d"
              },
              {
                "source": "lesson-33907436",
                "page": 343,
                "asset": "349cfd76d7f6208abeb6"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.3.7",
            "number": "1.3.7",
            "title": "形为2ᵃ−1的整数及其最大公因数",
            "chapter": "1",
            "section": "1.3",
            "parts": [
              {
                "lesson": "power-gcd",
                "anchor": "1-3-7-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33847191",
                "page": 321,
                "asset": "d8ce673b97b53a168097"
              }
            ],
            "sources": [
              {
                "source": "lesson-33847191",
                "page": 672,
                "asset": "705eff039000fd01a5b5"
              },
              {
                "source": "lesson-33907436",
                "page": 354,
                "asset": "2272c20cf016477d95c0"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "1.4",
        "number": "1.4",
        "title": "整除的进一步性质及最小公倍数",
        "chapter": "1",
        "section": "1.4",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33907436",
            "page": 371,
            "asset": "53ec699ec4a648b8f430"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "1.4.1",
            "number": "1.4.1",
            "title": "整除的进一步性质",
            "chapter": "1",
            "section": "1.4",
            "parts": [
              {
                "lesson": "euclid-lemma",
                "anchor": "1-4-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 371,
                "asset": "53ec699ec4a648b8f430"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 372,
                "asset": "dc941ced63f24125a8db"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.4.2",
            "number": "1.4.2",
            "title": "最小公倍数",
            "chapter": "1",
            "section": "1.4",
            "parts": [
              {
                "lesson": "lcm",
                "until": "### 与最大公因数的关系\n对正整数 a、b，$[a,b](a,b)=ab$。令 $d=(a,b)$，写 $a=du,b=dv$，其中 $(u,v)=1$，公倍数必须同时含有互素的",
                "label": "最小公倍数的定义",
                "anchor": "1-4-2-1"
              },
              {
                "lesson": "lcm",
                "from": "### 做题注意\n“最小”指最小正公倍数，不能直接拿含零、负数的大小顺序套定义。两个数的“乘积等于最大公因数乘最小公倍数”，不能不加条件推广为三个以上数的对应乘积式。原页中还保留了",
                "until": "例 7 也可逐步算：$[120,150]=120\\cdot150/30=600$；$(600,210)=30$，所以 $[600,210]=4200$；$35\\mid4200$，最",
                "label": "定义边界与课件练习",
                "anchor": "1-4-2-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 371,
                "asset": "53ec699ec4a648b8f430"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 398,
                "asset": "3927d31d135eb41150fc"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.4.3",
            "number": "1.4.3",
            "title": "最小公倍数与最大公因数",
            "chapter": "1",
            "section": "1.4",
            "parts": [
              {
                "lesson": "lcm",
                "from": "### 与最大公因数的关系\n对正整数 a、b，$[a,b](a,b)=ab$。令 $d=(a,b)$，写 $a=du,b=dv$，其中 $(u,v)=1$，公倍数必须同时含有互素的",
                "until": "### 做题注意\n“最小”指最小正公倍数，不能直接拿含零、负数的大小顺序套定义。两个数的“乘积等于最大公因数乘最小公倍数”，不能不加条件推广为三个以上数的对应乘积式。原页中还保留了",
                "label": "最小公倍数与最大公因数的关系",
                "anchor": "1-4-3-1"
              },
              {
                "lesson": "lcm",
                "from": "多选题假设 $a,b$ 互素且为正整数，$m$ 为正整数，四项全部正确：由 $a\\mid bc$ 约去互素的 $b$ 得 $a\\mid c$；由 $a,b\\mid D$ 得 $ab",
                "label": "互素条件下的课件选择题",
                "anchor": "1-4-3-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 371,
                "asset": "53ec699ec4a648b8f430"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 440,
                "asset": "a13ac56bbaf79c7f7e03"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.4.4",
            "number": "1.4.4",
            "title": "多个整数的最小公倍数及计算",
            "chapter": "1",
            "section": "1.4",
            "parts": [
              {
                "lesson": "lcm",
                "from": "例 7 也可逐步算：$[120,150]=120\\cdot150/30=600$；$(600,210)=30$，所以 $[600,210]=4200$；$35\\mid4200$，最",
                "until": "多选题假设 $a,b$ 互素且为正整数，$m$ 为正整数，四项全部正确：由 $a\\mid bc$ 约去互素的 $b$ 得 $a\\mid c$；由 $a,b\\mid D$ 得 $ab",
                "label": "多个整数最小公倍数的迭代例题",
                "anchor": "1-4-4-1"
              }
            ],
            "note": "课件原页以未编号标题讲解多个整数的最小公倍数；下面定位到已有讲解中的迭代例题，并保留小节目录中的1.4.4编号。",
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 371,
                "asset": "53ec699ec4a648b8f430"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 457,
                "asset": "0033510a99bddd9f5940"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          }
        ]
      },
      {
        "key": "1.5",
        "number": "1.5",
        "title": "整数分解",
        "chapter": "1",
        "section": "1.5",
        "parts": [
          {
            "lesson": "factor",
            "anchor": "1-5-1"
          }
        ],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33907436",
            "page": 476,
            "asset": "3022718cf88f994e915c"
          }
        ],
        "coverage": "body",
        "topics": []
      },
      {
        "key": "1.6",
        "number": "1.6",
        "title": "素数的算术基本定理",
        "chapter": "1",
        "section": "1.6",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33907436",
            "page": 495,
            "asset": "00f892bcad4530352a0f"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "1.6.1",
            "number": "1.6.1",
            "title": "算术基本定理",
            "chapter": "1",
            "section": "1.6",
            "parts": [
              {
                "lesson": "fta",
                "anchor": "1-6-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 495,
                "asset": "00f892bcad4530352a0f"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 496,
                "asset": "ace7112b12ff242e83d7"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "1.6.2",
            "number": "1.6.2",
            "title": "算术基本定理的应用",
            "chapter": "1",
            "section": "1.6",
            "parts": [
              {
                "lesson": "factor-app",
                "anchor": "1-6-2-1"
              }
            ],
            "note": "按小节目录保留1.6.2；正文将本项误印为1.6.1。",
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 495,
                "asset": "00f892bcad4530352a0f"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 526,
                "asset": "e69de56914926a3a8470"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          }
        ]
      },
      {
        "key": "1.7",
        "number": "1.7",
        "title": "素数定理",
        "chapter": "1",
        "section": "1.7",
        "parts": [
          {
            "lesson": "prime-dist",
            "anchor": "1-7-1"
          }
        ],
        "evidence": [
          {
            "source": "lesson-33847191",
            "page": 8,
            "asset": "709a261d11e44f36268c"
          }
        ],
        "sources": [
          {
            "source": "lesson-33907436",
            "page": 582,
            "asset": "6f7bd53e38566f06749b"
          }
        ],
        "coverage": "body",
        "topics": []
      }
    ]
  },
  "2": {
    "title": "同余",
    "intro": "2-intro",
    "home": {
      "source": "lesson-34093915",
      "page": 2,
      "asset": "2b556266b9c5f7f3aa39"
    },
    "sections": [
      {
        "key": "2.1",
        "number": "2.1",
        "title": "同余的概念及基本性质",
        "chapter": "2",
        "section": "2.1",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34093915",
            "page": 2,
            "asset": "2b556266b9c5f7f3aa39"
          }
        ],
        "sources": [
          {
            "source": "lesson-33907436",
            "page": 597,
            "asset": "4cdfba9d70f55e1faefd"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "2.1.1",
            "number": "2.1.1",
            "title": "同余的概念",
            "chapter": "2",
            "section": "2.1",
            "parts": [
              {
                "lesson": "congruence",
                "anchor": "2-1-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 597,
                "asset": "4cdfba9d70f55e1faefd"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 598,
                "asset": "d553b062aa5d90968b78"
              },
              {
                "source": "lesson-34019852",
                "page": 373,
                "asset": "b57c05041a491219d22e"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.1.2",
            "number": "2.1.2",
            "title": "同余的判断",
            "chapter": "2",
            "section": "2.1",
            "parts": [
              {
                "lesson": "congruence-test",
                "anchor": "2-1-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 597,
                "asset": "4cdfba9d70f55e1faefd"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 654,
                "asset": "f0e977071cc5d04a129d"
              },
              {
                "source": "lesson-34019852",
                "page": 429,
                "asset": "5ad92394eedb7d9a2c9b"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.1.3",
            "number": "2.1.3",
            "title": "同余的性质",
            "chapter": "2",
            "section": "2.1",
            "parts": [
              {
                "lesson": "congruence-props",
                "anchor": "2-1-3-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-33907436",
                "page": 597,
                "asset": "4cdfba9d70f55e1faefd"
              }
            ],
            "sources": [
              {
                "source": "lesson-33907436",
                "page": 755,
                "asset": "27cff106e60027987eb9"
              },
              {
                "source": "lesson-34019852",
                "page": 530,
                "asset": "38c915ae61ea467b31b0"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "2.2",
        "number": "2.2",
        "title": "剩余类及完全剩余系",
        "chapter": "2",
        "section": "2.2",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34093915",
            "page": 2,
            "asset": "2b556266b9c5f7f3aa39"
          }
        ],
        "sources": [
          {
            "source": "lesson-34093915",
            "page": 4,
            "asset": "041f7ab7dea944cb5130"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "2.2.1",
            "number": "2.2.1",
            "title": "剩余类与剩余",
            "chapter": "2",
            "section": "2.2",
            "parts": [
              {
                "lesson": "classes",
                "anchor": "2-2-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 4,
                "asset": "041f7ab7dea944cb5130"
              }
            ],
            "sources": [
              {
                "source": "lesson-34019852",
                "page": 645,
                "asset": "d6358f5af3880fa12c37"
              },
              {
                "source": "lesson-34093915",
                "page": 5,
                "asset": "e006588583132558eed2"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.2.2",
            "number": "2.2.2",
            "title": "完全剩余系",
            "chapter": "2",
            "section": "2.2",
            "parts": [
              {
                "lesson": "complete",
                "anchor": "2-2-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 4,
                "asset": "041f7ab7dea944cb5130"
              }
            ],
            "sources": [
              {
                "source": "lesson-34019852",
                "page": 696,
                "asset": "0ecbad5a63fc3833010c"
              },
              {
                "source": "lesson-34093915",
                "page": 56,
                "asset": "3851ad03083ee423602e"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.2.3",
            "number": "2.2.3",
            "title": "两个模的完全剩余系",
            "chapter": "2",
            "section": "2.2",
            "parts": [
              {
                "lesson": "multi-residue",
                "until": "多个两两互素的模时，令 $M=\\prod m_i,M_i=M/m_i$，$\\sum M_i k_i$ 同样遍历模 M 的所有类。这是中国剩余定理的构造基础。课件后续关于一个模的解如",
                "label": "两个模的完全剩余系",
                "anchor": "2-2-3-1"
              },
              {
                "lesson": "multi-residue",
                "from": "### 模 4 与模 5 的完全组合表\n例 4 的完全剩余系取 $k_1=0,1,2,3$、$k_2=0,1,2,3,4$。下表为 $5k_1+4k_2$ 的模 $20$ 余数，二",
                "label": "模4与模5的遍历表",
                "anchor": "2-2-3-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 4,
                "asset": "041f7ab7dea944cb5130"
              }
            ],
            "sources": [
              {
                "source": "lesson-34019852",
                "page": 728,
                "asset": "fd92e2ce3b6acb9f8bba"
              },
              {
                "source": "lesson-34093915",
                "page": 88,
                "asset": "f8fe9864ad637fb72935"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.2.4",
            "number": "2.2.4",
            "title": "多个模的完全剩余系",
            "chapter": "2",
            "section": "2.2",
            "parts": [
              {
                "lesson": "multi-residue",
                "from": "多个两两互素的模时，令 $M=\\prod m_i,M_i=M/m_i$，$\\sum M_i k_i$ 同样遍历模 M 的所有类。这是中国剩余定理的构造基础。课件后续关于一个模的解如",
                "until": "### 模 4 与模 5 的完全组合表\n例 4 的完全剩余系取 $k_1=0,1,2,3$、$k_2=0,1,2,3,4$。下表为 $5k_1+4k_2$ 的模 $20$ 余数，二",
                "label": "多个模的完全剩余系及转换",
                "anchor": "2-2-4-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 4,
                "asset": "041f7ab7dea944cb5130"
              }
            ],
            "sources": [
              {
                "source": "lesson-34019852",
                "page": 753,
                "asset": "63ac947bb843222987f0"
              },
              {
                "source": "lesson-34093915",
                "page": 113,
                "asset": "2ada2e54e285b152a80d"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "2.3",
        "number": "2.3",
        "title": "简化剩余系与欧拉函数",
        "chapter": "2",
        "section": "2.3",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34093915",
            "page": 2,
            "asset": "2b556266b9c5f7f3aa39"
          }
        ],
        "sources": [
          {
            "source": "lesson-34093915",
            "page": 129,
            "asset": "4823f40e8806b7c647e9"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "2.3.1",
            "number": "2.3.1",
            "title": "欧拉函数",
            "chapter": "2",
            "section": "2.3",
            "parts": [
              {
                "lesson": "phi",
                "anchor": "2-3-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 129,
                "asset": "4823f40e8806b7c647e9"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 130,
                "asset": "6256da0ae29c9b2733a4"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.3.2",
            "number": "2.3.2",
            "title": "简化剩余类与简化剩余系",
            "chapter": "2",
            "section": "2.3",
            "parts": [
              {
                "lesson": "reduced",
                "until": "### 两个模的简化剩余系\n若 $(m_1,m_2)=1$，$k_1,k_2$ 分别独立遍历简化剩余系，$m_2k_1+m_1k_2$ 遍历模 $m_1m_2$ 的简化剩余系。原页",
                "label": "简化剩余系、可逆乘法与逆元",
                "anchor": "2-3-2-1"
              },
              {
                "lesson": "reduced",
                "from": "### 原页补充：代表范围、方程与 635 的逆元\n模 $5$ 有四个简化剩余类 $C_1,C_2,C_3,C_4$。模 $30$ 的最小正简化剩余系为 $1,7,11,13,17",
                "until": "两模填空中，若 $(m_1,m_2)=1$，$m_2k_1$ 遍历模 $m_1$ 的简化剩余系，$m_1k_2$ 遍历模 $m_2$ 的简化剩余系，故两空依次填 $m_1,m_2$",
                "label": "代表元与逆元补充",
                "anchor": "2-3-2-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 129,
                "asset": "4823f40e8806b7c647e9"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 163,
                "asset": "45c27dfd853e460c209c"
              },
              {
                "source": "lesson-34093915",
                "page": 182,
                "asset": "c05351d0de351d8b4606"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.3.3",
            "number": "2.3.3",
            "title": "两个模的简化剩余系",
            "chapter": "2",
            "section": "2.3",
            "parts": [
              {
                "lesson": "reduced",
                "from": "### 两个模的简化剩余系\n若 $(m_1,m_2)=1$，$k_1,k_2$ 分别独立遍历简化剩余系，$m_2k_1+m_1k_2$ 遍历模 $m_1m_2$ 的简化剩余系。原页",
                "until": "### 原页补充：代表范围、方程与 635 的逆元\n模 $5$ 有四个简化剩余类 $C_1,C_2,C_3,C_4$。模 $30$ 的最小正简化剩余系为 $1,7,11,13,17",
                "label": "两个模的简化剩余系",
                "anchor": "2-3-3-1"
              },
              {
                "lesson": "reduced",
                "from": "两模填空中，若 $(m_1,m_2)=1$，$m_2k_1$ 遍历模 $m_1$ 的简化剩余系，$m_1k_2$ 遍历模 $m_2$ 的简化剩余系，故两空依次填 $m_1,m_2$",
                "label": "两个模的简化剩余系练习",
                "anchor": "2-3-3-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 129,
                "asset": "4823f40e8806b7c647e9"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 193,
                "asset": "26a1b72eecb2f2709f93"
              },
              {
                "source": "lesson-34093915",
                "page": 291,
                "asset": "538464a9cd33952a31f5"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.3.4",
            "number": "2.3.4",
            "title": "欧拉函数的性质",
            "chapter": "2",
            "section": "2.3",
            "parts": [
              {
                "lesson": "phi-props",
                "anchor": "2-3-4-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 129,
                "asset": "4823f40e8806b7c647e9"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 302,
                "asset": "0ebf538551a86c876930"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "2.4",
        "number": "2.4",
        "title": "欧拉定理、费马小定理和Wilson定理",
        "chapter": "2",
        "section": "2.4",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34093915",
            "page": 2,
            "asset": "2b556266b9c5f7f3aa39"
          }
        ],
        "sources": [
          {
            "source": "lesson-34093915",
            "page": 363,
            "asset": "439526984fe89edff803"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "2.4.1",
            "number": "2.4.1",
            "title": "欧拉定理",
            "chapter": "2",
            "section": "2.4",
            "parts": [
              {
                "lesson": "euler",
                "anchor": "2-4-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 363,
                "asset": "439526984fe89edff803"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 364,
                "asset": "0a1bf7468327551627d6"
              },
              {
                "source": "lesson-34268933",
                "page": 5,
                "asset": "157faa1bd148d039bdf8"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.4.2",
            "number": "2.4.2",
            "title": "费马小定理",
            "chapter": "2",
            "section": "2.4",
            "parts": [
              {
                "lesson": "fermat",
                "anchor": "2-4-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 363,
                "asset": "439526984fe89edff803"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 438,
                "asset": "ae168061aa9d1598d92b"
              },
              {
                "source": "lesson-34268933",
                "page": 79,
                "asset": "a3258ab27ff10154a89d"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "2.4.3",
            "number": "2.4.3",
            "title": "Wilson定理",
            "chapter": "2",
            "section": "2.4",
            "parts": [
              {
                "lesson": "wilson",
                "anchor": "2-4-3-1"
              }
            ],
            "note": "按小节目录保留2.4.3；正文将Wilson定理误印为2.4.2。",
            "evidence": [
              {
                "source": "lesson-34093915",
                "page": 363,
                "asset": "439526984fe89edff803"
              }
            ],
            "sources": [
              {
                "source": "lesson-34093915",
                "page": 465,
                "asset": "dc027a94a2124d959f91"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          }
        ]
      },
      {
        "key": "2.5",
        "number": "2.5",
        "title": "模重复平方计算法",
        "chapter": "2",
        "section": "2.5",
        "parts": [
          {
            "lesson": "fast-power",
            "anchor": "2-5-1"
          }
        ],
        "evidence": [
          {
            "source": "lesson-34093915",
            "page": 2,
            "asset": "2b556266b9c5f7f3aa39"
          }
        ],
        "sources": [
          {
            "source": "lesson-34268933",
            "page": 157,
            "asset": "9de8c36ceb511f802677"
          }
        ],
        "coverage": "body",
        "topics": []
      }
    ]
  },
  "3": {
    "title": "同余式",
    "intro": "3-intro",
    "home": {
      "source": "lesson-34268933",
      "page": 285,
      "asset": "4943da26fcfac29cbbde"
    },
    "sections": [
      {
        "key": "3.1",
        "number": "3.1",
        "title": "基本概念及一次同余式",
        "chapter": "3",
        "section": "3.1",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34268933",
            "page": 285,
            "asset": "4943da26fcfac29cbbde"
          }
        ],
        "sources": [
          {
            "source": "lesson-34268933",
            "page": 286,
            "asset": "d3cdd8fd201a4d7c9fab"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "3.1.1",
            "number": "3.1.1",
            "title": "同余式的基本概念",
            "chapter": "3",
            "section": "3.1",
            "parts": [
              {
                "lesson": "equation",
                "anchor": "3-1-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34268933",
                "page": 286,
                "asset": "d3cdd8fd201a4d7c9fab"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 287,
                "asset": "35099ec98989699d8310"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.1.2",
            "number": "3.1.2",
            "title": "一次同余式",
            "chapter": "3",
            "section": "3.1",
            "parts": [
              {
                "lesson": "linear",
                "anchor": "3-1-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34268933",
                "page": 286,
                "asset": "d3cdd8fd201a4d7c9fab"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 327,
                "asset": "f036b939c1475bccc545"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "3.2",
        "number": "3.2",
        "title": "中国剩余定理",
        "chapter": "3",
        "section": "3.2",
        "parts": [
          {
            "lesson": "crt-story",
            "anchor": "3-2-1"
          }
        ],
        "evidence": [
          {
            "source": "lesson-34268933",
            "page": 285,
            "asset": "4943da26fcfac29cbbde"
          }
        ],
        "sources": [
          {
            "source": "section2",
            "page": 4,
            "asset": "565559cab758f7dd7914"
          }
        ],
        "coverage": "body",
        "topics": [
          {
            "key": "3.2.1",
            "number": "3.2.1",
            "title": "两个方程的中国剩余定理",
            "chapter": "3",
            "section": "3.2",
            "parts": [
              {
                "lesson": "crt-two",
                "anchor": "3-2-1-1"
              }
            ],
            "evidence": [
              {
                "source": "section2",
                "page": 4,
                "asset": "565559cab758f7dd7914"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 474,
                "asset": "1cd4fa6b56ead136734f"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.2.2",
            "number": "3.2.2",
            "title": "一般形式的中国剩余定理",
            "chapter": "3",
            "section": "3.2",
            "parts": [
              {
                "lesson": "crt-general",
                "anchor": "3-2-2-1"
              }
            ],
            "evidence": [
              {
                "source": "section2",
                "page": 4,
                "asset": "565559cab758f7dd7914"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 545,
                "asset": "3d5777e4f4ca30e7b121"
              },
              {
                "source": "lesson-34268933",
                "page": 584,
                "asset": "bd06b8e794392527b2bf"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.2.3",
            "number": "3.2.3",
            "title": "一次同余式组的迭代求解",
            "chapter": "3",
            "section": "3.2",
            "parts": [
              {
                "lesson": "crt-iterate",
                "anchor": "3-2-3-1"
              }
            ],
            "evidence": [
              {
                "source": "section2",
                "page": 4,
                "asset": "565559cab758f7dd7914"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 602,
                "asset": "3b20f71efb29f1100464"
              },
              {
                "source": "lesson-34268933",
                "page": 638,
                "asset": "b51bd694f40f2698a2f1"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.2.4",
            "number": "3.2.4",
            "title": "中国剩余定理之应用——算法优化",
            "chapter": "3",
            "section": "3.2",
            "parts": [
              {
                "lesson": "crt-opt",
                "anchor": "3-2-4-1"
              }
            ],
            "evidence": [
              {
                "source": "section2",
                "page": 4,
                "asset": "565559cab758f7dd7914"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 681,
                "asset": "514ed8a444f9a08f2197"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.2.5",
            "number": "3.2.5",
            "title": "中国剩余定理与剩余系遍历",
            "chapter": "3",
            "section": "3.2",
            "parts": [
              {
                "lesson": "crt-traverse",
                "anchor": "3-2-5-1"
              }
            ],
            "evidence": [
              {
                "source": "section2",
                "page": 4,
                "asset": "565559cab758f7dd7914"
              }
            ],
            "sources": [
              {
                "source": "lesson-34268933",
                "page": 719,
                "asset": "831adf555dc78d934772"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "3.3",
        "number": "3.3",
        "title": "高次同余式的解数及解法",
        "chapter": "3",
        "section": "3.3",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34268933",
            "page": 285,
            "asset": "4943da26fcfac29cbbde"
          }
        ],
        "sources": [
          {
            "source": "lesson-34580288",
            "page": 4,
            "asset": "15e6236da3301f076327"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "3.3.1",
            "number": "3.3.1",
            "title": "高次同余式的解数",
            "chapter": "3",
            "section": "3.3",
            "parts": [
              {
                "lesson": "root-count",
                "anchor": "3-3-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34580288",
                "page": 4,
                "asset": "15e6236da3301f076327"
              }
            ],
            "sources": [
              {
                "source": "lesson-34580288",
                "page": 5,
                "asset": "c461e3ae14cdf136c2da"
              },
              {
                "source": "section3",
                "page": 5,
                "asset": "5805ba488f9f1e74d65e"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.3.2",
            "number": "3.3.2",
            "title": "高次同余式的提升及应用",
            "chapter": "3",
            "section": "3.3",
            "parts": [
              {
                "lesson": "hensel",
                "anchor": "3-3-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34580288",
                "page": 4,
                "asset": "15e6236da3301f076327"
              }
            ],
            "sources": [
              {
                "source": "lesson-34580288",
                "page": 41,
                "asset": "75e7e0232d3b9f093f94"
              },
              {
                "source": "section3",
                "page": 41,
                "asset": "86c3750ca00ef55ed422"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "3.4",
        "number": "3.4",
        "title": "素数模的同余式",
        "chapter": "3",
        "section": "3.4",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34268933",
            "page": 285,
            "asset": "4943da26fcfac29cbbde"
          }
        ],
        "sources": [
          {
            "source": "lesson-34580288",
            "page": 202,
            "asset": "26d7dfd0221c8642d6e7"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "3.4.1",
            "number": "3.4.1",
            "title": "多项式的欧几里得除法",
            "chapter": "3",
            "section": "3.4",
            "parts": [
              {
                "lesson": "poly-div",
                "anchor": "3-4-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34580288",
                "page": 202,
                "asset": "26d7dfd0221c8642d6e7"
              }
            ],
            "sources": [
              {
                "source": "lesson-34580288",
                "page": 203,
                "asset": "73fcc6a819d7840140d8"
              },
              {
                "source": "lesson-34607112",
                "page": 5,
                "asset": "d7875d25e3359287a940"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.4.2",
            "number": "3.4.2",
            "title": "素数模的同余式的简化",
            "chapter": "3",
            "section": "3.4",
            "parts": [
              {
                "lesson": "poly-reduce",
                "anchor": "3-4-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34580288",
                "page": 202,
                "asset": "26d7dfd0221c8642d6e7"
              }
            ],
            "sources": [
              {
                "source": "lesson-34580288",
                "page": 242,
                "asset": "95b60c318bb9392477e3"
              },
              {
                "source": "lesson-34607112",
                "page": 44,
                "asset": "edda359d7716283c043a"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.4.3",
            "number": "3.4.3",
            "title": "素数模的同余式的一次因式分解",
            "chapter": "3",
            "section": "3.4",
            "parts": [
              {
                "lesson": "poly-factor",
                "anchor": "3-4-3-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34580288",
                "page": 202,
                "asset": "26d7dfd0221c8642d6e7"
              }
            ],
            "sources": [
              {
                "source": "lesson-34580288",
                "page": 330,
                "asset": "dba373f9d61d67135a24"
              },
              {
                "source": "lesson-34607112",
                "page": 134,
                "asset": "17c71b07759cd5da8d26"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "3.4.4",
            "number": "3.4.4",
            "title": "素数模的同余式的解数估计",
            "chapter": "3",
            "section": "3.4",
            "parts": [
              {
                "lesson": "poly-count",
                "anchor": "3-4-4-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34580288",
                "page": 202,
                "asset": "26d7dfd0221c8642d6e7"
              }
            ],
            "sources": [
              {
                "source": "lesson-34580288",
                "page": 428,
                "asset": "7e63a19c95cb18858745"
              },
              {
                "source": "lesson-34607112",
                "page": 232,
                "asset": "24e91a7a8165f2982d01"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      }
    ]
  },
  "4": {
    "title": "二次同余式与平方剩余",
    "intro": "4-intro",
    "home": {
      "source": "lesson-34927552",
      "page": 2,
      "asset": "6aae8c077bb96fac97a6"
    },
    "sections": [
      {
        "key": "4.1",
        "number": "4.1",
        "title": "一般二次同余式",
        "chapter": "4",
        "section": "4.1",
        "parts": [
          {
            "lesson": "quadratic",
            "anchor": "4-1-1"
          },
          {
            "lesson": "qr-def",
            "anchor": "4-1-2"
          }
        ],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34677074",
            "page": 4,
            "asset": "600ea0cd0c0a6385d6fd"
          }
        ],
        "coverage": "body",
        "topics": []
      },
      {
        "key": "4.2",
        "number": "4.2",
        "title": "模为奇素数的平方剩余与平方非剩余",
        "chapter": "4",
        "section": "4.2",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34677074",
            "page": 74,
            "asset": "9e84ff4813faf0ee9a65"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "4.2.1",
            "number": "4.2.1",
            "title": "奇素数模p的平方（非）剩余判别条件",
            "chapter": "4",
            "section": "4.2",
            "parts": [
              {
                "lesson": "qr-euler",
                "until": "非零平方剩余各有两个根 ±x；这两个类不同，因为 p 是奇数。因此模 p 的非零平方剩余与平方非剩余各有 $(p-1)/2$ 个。用 $1^2,\\ldots,((p-1)/2)^2",
                "label": "欧拉判别条件及必要方向",
                "anchor": "4-2-1-1"
              },
              {
                "lesson": "qr-euler",
                "from": "补足“判别为 $1$ 就一定有平方根”的方向：令 $h=(p-1)/2$。已经找到 $h$ 个不同平方剩余，都满足 $z^h-1\\equiv0$；由素数模根界，这个 $h$ 次非零",
                "until": "模 $19$ 的全部非零平方剩余为 $1,4,5,6,7,9,11,16,17$。用 $1$ 至 $9$ 的平方即可得到，后面的 $10$ 至 $18$ 只是负根对应的重复值。",
                "label": "充分方向、乘法规律与判别例题",
                "anchor": "4-2-1-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34677074",
                "page": 74,
                "asset": "9e84ff4813faf0ee9a65"
              }
            ],
            "sources": [
              {
                "source": "lesson-34677074",
                "page": 75,
                "asset": "c19d8db9dfa1509b62bd"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "4.2.2",
            "number": "4.2.2",
            "title": "奇素数模p的平方（非）剩余的个数",
            "chapter": "4",
            "section": "4.2",
            "parts": [
              {
                "lesson": "qr-euler",
                "from": "非零平方剩余各有两个根 ±x；这两个类不同，因为 p 是奇数。因此模 p 的非零平方剩余与平方非剩余各有 $(p-1)/2$ 个。用 $1^2,\\ldots,((p-1)/2)^2",
                "until": "补足“判别为 $1$ 就一定有平方根”的方向：令 $h=(p-1)/2$。已经找到 $h$ 个不同平方剩余，都满足 $z^h-1\\equiv0$；由素数模根界，这个 $h$ 次非零",
                "label": "平方剩余与非剩余各有多少个",
                "anchor": "4-2-2-1"
              },
              {
                "lesson": "qr-euler",
                "from": "模 $19$ 的全部非零平方剩余为 $1,4,5,6,7,9,11,16,17$。用 $1$ 至 $9$ 的平方即可得到，后面的 $10$ 至 $18$ 只是负根对应的重复值。",
                "label": "剩余列表、计数及练习",
                "anchor": "4-2-2-2"
              }
            ],
            "note": "没有找到独立编号的正文标题；计数定理和列表确实在本节原页与现有讲解中，下面直接定位相应段落。",
            "evidence": [
              {
                "source": "lesson-34677074",
                "page": 74,
                "asset": "9e84ff4813faf0ee9a65"
              }
            ],
            "sources": [
              {
                "source": "lesson-34677074",
                "page": 146,
                "asset": "101001da655a08f64f6d"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          }
        ]
      },
      {
        "key": "4.3",
        "number": "4.3",
        "title": "勒让得符号",
        "chapter": "4",
        "section": "4.3",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34677074",
            "page": 159,
            "asset": "7203e0ee6cdd789c2194"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "4.3.1",
            "number": "4.3.1",
            "title": "Legendre符号的运算性质",
            "chapter": "4",
            "section": "4.3",
            "parts": [
              {
                "lesson": "legendre",
                "anchor": "4-3-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34677074",
                "page": 159,
                "asset": "7203e0ee6cdd789c2194"
              }
            ],
            "sources": [
              {
                "source": "lesson-34677074",
                "page": 166,
                "asset": "7ca86a4aecca42b023ac"
              },
              {
                "source": "lesson-34767597",
                "page": 133,
                "asset": "feb2826622982f6ea8d0"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "4.3.2",
            "number": "4.3.2",
            "title": "Gauss引理",
            "chapter": "4",
            "section": "4.3",
            "parts": [
              {
                "lesson": "gauss",
                "anchor": "4-3-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34677074",
                "page": 159,
                "asset": "7203e0ee6cdd789c2194"
              }
            ],
            "sources": [
              {
                "source": "lesson-34677074",
                "page": 238,
                "asset": "8f197176d89c3f003aae"
              },
              {
                "source": "lesson-34767597",
                "page": 205,
                "asset": "33d77405ea37c9c10c31"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "4.4",
        "number": "4.4",
        "title": "二次互反律",
        "chapter": "4",
        "section": "4.4",
        "parts": [
          {
            "lesson": "reciprocity",
            "anchor": "4-4-1"
          },
          {
            "lesson": "reciprocity-app",
            "anchor": "4-4-2"
          }
        ],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34677074",
            "page": 254,
            "asset": "c64264d6448218de6d74"
          }
        ],
        "coverage": "body",
        "topics": []
      },
      {
        "key": "4.5",
        "number": "4.5",
        "title": "雅可比符号",
        "chapter": "4",
        "section": "4.5",
        "parts": [
          {
            "lesson": "jacobi",
            "anchor": "4-5-1"
          }
        ],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34767597",
            "page": 4,
            "asset": "36d649dcb468e270ca49"
          }
        ],
        "coverage": "body",
        "topics": []
      },
      {
        "key": "4.6",
        "number": "4.6",
        "title": "模平方根",
        "chapter": "4",
        "section": "4.6",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34767597",
            "page": 346,
            "asset": "399ae950ddde6a66ebde"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "4.6.1",
            "number": "4.6.1",
            "title": "模p平方根（p=4k+3形素数）",
            "chapter": "4",
            "section": "4.6",
            "parts": [
              {
                "lesson": "sqrt-special",
                "anchor": "4-6-1-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34767597",
                "page": 346,
                "asset": "399ae950ddde6a66ebde"
              }
            ],
            "sources": [
              {
                "source": "lesson-34767597",
                "page": 347,
                "asset": "dcfedf406daf63e1690f"
              },
              {
                "source": "lesson-34767597",
                "page": 373,
                "asset": "c4c890153a23d2fe936e"
              },
              {
                "source": "lesson-34767597",
                "page": 374,
                "asset": "c2934866a02ca11246f4"
              },
              {
                "source": "lesson-34927552",
                "page": 5,
                "asset": "718feaff5f3f85b77b7c"
              },
              {
                "source": "lesson-34927552",
                "page": 31,
                "asset": "ccb172b19aff7dcfb5b0"
              },
              {
                "source": "lesson-34927552",
                "page": 32,
                "asset": "a041b1f2e313a407a4b7"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "4.6.2",
            "number": "4.6.2",
            "title": "模p平方根（p为一般奇素数）",
            "chapter": "4",
            "section": "4.6",
            "parts": [
              {
                "lesson": "sqrt-general",
                "anchor": "4-6-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34767597",
                "page": 346,
                "asset": "399ae950ddde6a66ebde"
              }
            ],
            "sources": [
              {
                "source": "lesson-34767597",
                "page": 393,
                "asset": "a08add8fb609324bacdf"
              },
              {
                "source": "lesson-34927552",
                "page": 51,
                "asset": "cf4ce00ee3528ea476ab"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "4.6.3",
            "number": "4.6.3",
            "title": "模m平方根",
            "chapter": "4",
            "section": "4.6",
            "parts": [
              {
                "lesson": "sqrt-odd-power",
                "anchor": "4-6-3-1"
              },
              {
                "lesson": "sqrt-two",
                "anchor": "4-6-3-2"
              },
              {
                "lesson": "sqrt-composite",
                "anchor": "4-6-3-3"
              }
            ],
            "evidence": [
              {
                "source": "lesson-34767597",
                "page": 346,
                "asset": "399ae950ddde6a66ebde"
              }
            ],
            "sources": [
              {
                "source": "lesson-34767597",
                "page": 637,
                "asset": "af7434e9b1d93948a4bf"
              },
              {
                "source": "lesson-34927552",
                "page": 295,
                "asset": "aad4477e4249e2d267a1"
              }
            ],
            "coverage": "body_heading_found"
          }
        ]
      },
      {
        "key": "4.7",
        "number": "4.7",
        "title": "x²+y²=p",
        "chapter": "4",
        "section": "4.7",
        "parts": [
          {
            "lesson": "sum-squares",
            "anchor": "4-7-1"
          }
        ],
        "evidence": [
          {
            "source": "lesson-34927552",
            "page": 2,
            "asset": "6aae8c077bb96fac97a6"
          }
        ],
        "sources": [
          {
            "source": "lesson-34927552",
            "page": 424,
            "asset": "b334ea58367bd9ed0a8f"
          }
        ],
        "coverage": "body",
        "topics": []
      }
    ]
  },
  "8": {
    "title": "群、环、域",
    "intro": "8-intro",
    "home": {
      "source": "lesson-35006615",
      "page": 3,
      "asset": "e4cd2b3865f8559d8bde"
    },
    "sections": [
      {
        "key": "8.1",
        "number": "8.1",
        "title": "群",
        "chapter": "8",
        "section": "8.1",
        "parts": [],
        "evidence": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "sources": [
          {
            "source": "lesson-35006615",
            "page": 5,
            "asset": "ec02f5f53afa722d7d44"
          }
        ],
        "coverage": "source_heading",
        "topics": [
          {
            "key": "8.1.1",
            "number": "8.1.1",
            "title": "代数系统与运算律",
            "chapter": "8",
            "section": "8.1",
            "parts": [
              {
                "lesson": "binary",
                "anchor": "8-1-1-1"
              },
              {
                "lesson": "laws",
                "anchor": "8-1-1-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-35006615",
                "page": 13,
                "asset": "704687e9e9cd2a2c8c55"
              }
            ],
            "sources": [
              {
                "source": "lesson-34927552",
                "page": 460,
                "asset": "e3325f30bd14a9106c1f"
              },
              {
                "source": "lesson-35006615",
                "page": 13,
                "asset": "704687e9e9cd2a2c8c55"
              }
            ],
            "coverage": "body_heading_found"
          },
          {
            "key": "8.1.2",
            "number": "8.1.2",
            "title": "半群与群",
            "chapter": "8",
            "section": "8.1",
            "parts": [
              {
                "lesson": "semigroup",
                "anchor": "8-1-2-1"
              },
              {
                "lesson": "group",
                "anchor": "8-1-2-2"
              }
            ],
            "evidence": [
              {
                "source": "lesson-35006615",
                "page": 100,
                "asset": "f0ac80f9d64c7c0084dc"
              }
            ],
            "sources": [
              {
                "source": "lesson-35006615",
                "page": 100,
                "asset": "f0ac80f9d64c7c0084dc"
              }
            ],
            "coverage": "toc_heading_only_or_ocr_missed"
          },
          {
            "key": "8.1-heading-1",
            "number": null,
            "title": "群的性质",
            "chapter": "8",
            "section": "8.1",
            "parts": [
              {
                "lesson": "group-props",
                "anchor": "8-1-heading-1-1"
              },
              {
                "lesson": "group-examples",
                "anchor": "8-1-heading-1-2"
              },
              {
                "lesson": "group-power",
                "anchor": "8-1-heading-1-3"
              }
            ],
            "sourceLabel": "三",
            "evidence": [
              {
                "source": "lesson-35006615",
                "page": 152,
                "asset": "539e082c84159bfbeb2c"
              }
            ],
            "sources": [
              {
                "source": "lesson-35006615",
                "page": 152,
                "asset": "539e082c84159bfbeb2c"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.1-heading-2",
            "number": null,
            "title": "群的判定",
            "chapter": "8",
            "section": "8.1",
            "parts": [
              {
                "lesson": "group-tests",
                "anchor": "8-1-heading-2-1"
              }
            ],
            "evidence": [
              {
                "source": "lesson-35006615",
                "page": 152,
                "asset": "539e082c84159bfbeb2c"
              }
            ],
            "sources": [
              {
                "source": "lesson-35006615",
                "page": 152,
                "asset": "539e082c84159bfbeb2c"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.1-heading-3",
            "number": null,
            "title": "群的定义",
            "readingStatus": "related_reading",
            "readingLabel": "教材标题，讲解见8.1.2",
            "relatedTopics": [
              {
                "key": "8.1.2",
                "label": "8.1.2 半群与群"
              }
            ],
            "chapter": "8",
            "section": "8.1",
            "parts": [],
            "sourceLabel": "§6.2",
            "note": "这是课件沿用的教材标题§6.2，保留原编号；原页位于置换群材料开头。群的定义讲解见8.1.2，不将其改编为新的8.x.x编号。",
            "evidence": [
              {
                "source": "lesson-35159940",
                "page": 311,
                "asset": "271dab45f1245cfb0af2"
              }
            ],
            "sources": [
              {
                "source": "lesson-35159940",
                "page": 311,
                "asset": "271dab45f1245cfb0af2"
              }
            ],
            "coverage": "source_heading"
          },
          {
            "key": "8.1-heading-4",
            "number": null,
            "title": "置换群",
            "chapter": "8",
            "section": "8.1",
            "parts": [
              {
                "lesson": "permutation",
                "anchor": "8-1-heading-4-1"
              },
              {
                "lesson": "cycles",
                "anchor": "8-1-heading-4-2"
              },
              {
                "lesson": "cycle-decomp",
                "anchor": "8-1-heading-4-3"
              },
              {
                "lesson": "parity",
                "anchor": "8-1-heading-4-4"
              },
              {
                "lesson": "group-table",
                "anchor": "8-1-heading-4-5"
              }
            ],
            "sourceLabel": "四",
            "evidence": [
              {
                "source": "lesson-35239721",
                "page": 2,
                "asset": "3cf40a03a683878f6a49"
              }
            ],
            "sources": [
              {
                "source": "lesson-35239721",
                "page": 2,
                "asset": "3cf40a03a683878f6a49"
              }
            ],
            "coverage": "body"
          }
        ]
      },
      {
        "key": "8.2",
        "number": "8.2",
        "title": "子群",
        "sectionReadingLabel": "子群定义、循环群与本节例题",
        "chapter": "8",
        "section": "8.2",
        "parts": [
          {
            "lesson": "subgroup",
            "anchor": "8-2-1"
          },
          {
            "lesson": "generated",
            "anchor": "8-2-2"
          },
          {
            "lesson": "cyclic",
            "anchor": "8-2-3"
          },
          {
            "lesson": "generators",
            "until": "### 同构：保留运算的重新命名\n两个群同构，指存在双射 $f:G\\to K$，使 $f(xy)=f(x)f(y)$；加法群应按各自运算改写。双射保证元素一一对应，保运算保证乘法关",
            "label": "循环群的生成元",
            "anchor": "8-2-4"
          },
          {
            "lesson": "cyclic-subgroup",
            "anchor": "8-2-5"
          }
        ],
        "note": "11月4日的《第八章-4-原版》对应合并来源第1—320页，覆盖子群、循环群与元素周期。子群定义、生成子群、循环群及相关例题的讲解保留在本节正文入口；下列条目仅列课件中另有标题的知识点，不能代替本节全部正文，也不据此新增8.2.x编号。",
        "evidence": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "sources": [
          {
            "source": "chapter8-4",
            "page": 2,
            "asset": "cdc20373d3ceeb23e583"
          }
        ],
        "coverage": "body",
        "topics": [
          {
            "key": "8.2-heading-1",
            "number": null,
            "title": "子群H的判定",
            "chapter": "8",
            "section": "8.2",
            "parts": [
              {
                "lesson": "subgroup-tests",
                "until": "### 例：倍数集合与交集\n对 $x=km,y=lm\\in m\\mathbb Z$，有 $x-y=(k-l)m\\in m\\mathbb Z$，且0在其中，所以 $m\\mathbb ",
                "label": "子群的三种判别",
                "anchor": "8-2-heading-1-1"
              }
            ],
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 41,
                "asset": "9d05d0ce7fed320ad1b0"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 41,
                "asset": "9d05d0ce7fed320ad1b0"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.2-heading-2",
            "number": null,
            "title": "子群H与大群G的关系",
            "chapter": "8",
            "section": "8.2",
            "parts": [
              {
                "lesson": "subgroup-tests",
                "from": "### 例：倍数集合与交集\n对 $x=km,y=lm\\in m\\mathbb Z$，有 $x-y=(k-l)m\\in m\\mathbb Z$，且0在其中，所以 $m\\mathbb ",
                "label": "子群交与集合乘积",
                "anchor": "8-2-heading-2-1"
              }
            ],
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 77,
                "asset": "a45b3a0e0c439197f92a"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 77,
                "asset": "a45b3a0e0c439197f92a"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.2-heading-3",
            "number": null,
            "title": "元素的周期",
            "chapter": "8",
            "section": "8.2",
            "parts": [
              {
                "lesson": "order",
                "until": "### 逆元和幂的阶\n$a^{-1}$ 与 $a$ 同阶，因为 $(a^{-1})^k=e$ 当且仅当 $a^k=e$。所以课件问“若 $a$ 的周期为3，$a^{-1}$ 能否周",
                "label": "元素周期及等价判别",
                "anchor": "8-2-heading-3-1"
              }
            ],
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 158,
                "asset": "9ed2fc75f520cfdefcd8"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 158,
                "asset": "9ed2fc75f520cfdefcd8"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.2-heading-4",
            "number": null,
            "title": "群中元素的周期",
            "chapter": "8",
            "section": "8.2",
            "parts": [
              {
                "lesson": "order",
                "from": "### 逆元和幂的阶\n$a^{-1}$ 与 $a$ 同阶，因为 $(a^{-1})^k=e$ 当且仅当 $a^k=e$。所以课件问“若 $a$ 的周期为3，$a^{-1}$ 能否周",
                "label": "逆元、幂与加法群中的周期",
                "anchor": "8-2-heading-4-1"
              }
            ],
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 195,
                "asset": "9a714253ab72812de276"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 195,
                "asset": "9a714253ab72812de276"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.2-heading-5",
            "number": null,
            "title": "群的同构",
            "chapter": "8",
            "section": "8.2",
            "parts": [
              {
                "lesson": "generators",
                "from": "### 同构：保留运算的重新命名\n两个群同构，指存在双射 $f:G\\to K$，使 $f(xy)=f(x)f(y)$；加法群应按各自运算改写。双射保证元素一一对应，保运算保证乘法关",
                "label": "循环群中的同构实例",
                "anchor": "8-2-heading-5-1"
              }
            ],
            "note": "这里是8.2子群材料中的循环群同构实例；不代表8.4整节同态与同构课件已经找到。",
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 269,
                "asset": "865b468b761e55f75da1"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 269,
                "asset": "865b468b761e55f75da1"
              }
            ],
            "coverage": "body"
          }
        ],
        "material": {
          "source": "chapter8-4",
          "title": "11月4日 · 第八章-4-原版",
          "start": 1,
          "end": 320
        }
      },
      {
        "key": "8.3",
        "number": "8.3",
        "title": "子群的陪集",
        "sectionReadingLabel": "陪集定义、正规子群与本节例题",
        "chapter": "8",
        "section": "8.3",
        "parts": [
          {
            "lesson": "cosets",
            "until": "$b$ 所在等价类是 $bH=\\{bh:h\\in H\\}$。课件称它为 $H$ 的右陪集；许多其他教材称它为左陪集。本章沿用课件命名，始终以 $bH$ 这个公式为准。相应的另一类集",
            "label": "模子群合同与陪集的定义",
            "anchor": "8-3-1"
          },
          {
            "lesson": "normal",
            "anchor": "8-3-2"
          },
          {
            "lesson": "cyclic-subgroups",
            "anchor": "8-3-3"
          },
          {
            "lesson": "small-groups",
            "anchor": "8-3-4"
          },
          {
            "lesson": "order-criterion",
            "anchor": "8-3-5"
          }
        ],
        "note": "11月4日的《第八章-5-原版》对应合并来源第321—625页；第321页为该份封面，第322页为8.3目录，合同关系与陪集正文自第331页起。合同关系与陪集定义、正规子群及相关例题的讲解保留在本节正文入口；下列条目仅列课件中另有标题的知识点，不能代替本节全部正文，也不据此新增8.3.x编号。",
        "evidence": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "sources": [
          {
            "source": "chapter8-4",
            "page": 322,
            "asset": "814128f77397497e3923"
          }
        ],
        "coverage": "body",
        "topics": [
          {
            "key": "8.3-heading-1",
            "number": null,
            "title": "陪集的性质",
            "chapter": "8",
            "section": "8.3",
            "parts": [
              {
                "lesson": "cosets",
                "from": "$b$ 所在等价类是 $bH=\\{bh:h\\in H\\}$。课件称它为 $H$ 的右陪集；许多其他教材称它为左陪集。本章沿用课件命名，始终以 $bH$ 这个公式为准。相应的另一类集",
                "label": "陪集的性质与完整课件例题",
                "anchor": "8-3-heading-1-1"
              }
            ],
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 471,
                "asset": "f12c6e00e933f40d8f9e"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 471,
                "asset": "f12c6e00e933f40d8f9e"
              }
            ],
            "coverage": "body"
          },
          {
            "key": "8.3-heading-2",
            "number": null,
            "title": "Lagrange定理",
            "chapter": "8",
            "section": "8.3",
            "parts": [
              {
                "lesson": "lagrange",
                "anchor": "8-3-heading-2-1"
              }
            ],
            "evidence": [
              {
                "source": "chapter8-4",
                "page": 514,
                "asset": "22037362635143c7b7d1"
              }
            ],
            "sources": [
              {
                "source": "chapter8-4",
                "page": 514,
                "asset": "22037362635143c7b7d1"
              }
            ],
            "coverage": "body"
          }
        ],
        "material": {
          "source": "chapter8-4",
          "title": "11月4日 · 第八章-5-原版",
          "start": 321,
          "end": 625
        }
      },
      {
        "key": "8.4",
        "number": "8.4",
        "title": "群的同态与同构",
        "readingStatus": "toc_only",
        "readingLabel": "仅找到章首页目录",
        "chapter": "8",
        "section": "8.4",
        "parts": [],
        "note": "章首页列有本节，现有资料未找到对应正文课件与独立讲解。",
        "evidence": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "sources": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "coverage": "chapter_home_only",
        "topics": []
      },
      {
        "key": "8.5",
        "number": "8.5",
        "title": "环与域",
        "readingStatus": "toc_only",
        "readingLabel": "仅找到章首页目录",
        "chapter": "8",
        "section": "8.5",
        "parts": [],
        "note": "章首页列有本节，现有资料未找到对应正文课件与独立讲解。",
        "evidence": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "sources": [
          {
            "source": "lesson-35006615",
            "page": 3,
            "asset": "e4cd2b3865f8559d8bde"
          }
        ],
        "coverage": "chapter_home_only",
        "topics": []
      }
    ],
    "sourceParts": [
      {
        "source": "chapter8-4",
        "title": "11月4日 · 第八章-4-原版",
        "start": 1,
        "end": 320
      },
      {
        "source": "chapter8-4",
        "title": "11月4日 · 第八章-5-原版",
        "start": 321,
        "end": 625
      }
    ]
  }
};
