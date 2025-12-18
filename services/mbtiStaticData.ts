
export interface MBTISample {
    type: string;
    othersSee: string;
    functions: string;
    bestState: string;
    growth: string;
    features: string;
}

export const MBTI_SAMPLES: Record<string, MBTISample> = {
    'ESTJ': {
        type: 'ESTJ',
        othersSee: '由于ESTJ天生就会设计系统、程序和日程表，因此其他人会依赖他们来负责并取得成果。其他人可能会觉得ESTJ有时过于强势，因为他们对事情应该如何发展非常有把握。在其他人眼中，ESTJ通常表现为认真、可靠、果断、直率、自信。',
        functions: 'Te-Si-Ne-Fi，Ti-Se-Ni-Fe',
        bestState: 'ESTJ喜欢组织项目、程序和人员，然后采取行动完成任务。他们有一套明确的标准和信念，会系统地努力遵循这些标准和信念，并对他人抱有同样的期望。他们重视能力、效率和结果。',
        growth: '有时候可能会变得死板和教条，或者对细节挑三拣四。压力大时，可能会感到孤独和不被重视而顾影自怜。',
        features: '逻辑性强、善于分析、客观挑剔。果断、清晰、自信。'
    },
    'INTP': {
        type: 'INTP',
        othersSee: 'INTP通常沉默寡言，但在他们特别了解的领域，他们也会侃侃而谈。在他人眼中，表现为安静、内敛、冷静和超然的观察者。',
        functions: 'Ti-Ne-Si-Fe，Te-Ni-Se-Fi',
        bestState: 'INTP是独立的问题解决者，擅长对想法或情况进行抽象、简洁的分析。当他们被允许独立解决一个深度难题时，最佳工作状态就会出现。',
        growth: '如果不发展直觉功能，可能就很难将自己的想法付诸实践。压力大时，可能会爆发出不恰当的情绪表现。',
        features: '逻辑严密、善于分析、客观批判。对想法、理论和事物运作的原理有强烈的好奇心。'
    },
    'ISFP': {
        type: 'ISFP',
        othersSee: 'ISFP具有很强的适应性和灵活性。他们非常关心他人，但更多的是通过为他人做事而不是言语来表达。在其他人眼中，表现为安静、矜持、自发、宽容。',
        functions: 'Fi-Se-Ni-Te, Fe-Si-Ne-Ti',
        bestState: 'ISFP活在当下，充满宁静的喜悦感。他们忠实地履行对自己重要的人和事的义务。',
        growth: '如果情感功能没得到发展，可能会逃避做决定。压力大时，会变得对自己和他人非常挑剔。',
        features: '信任、善良、体贴。现实、实际、具体。'
    },
    'ENTP': {
        type: 'ENTP',
        othersSee: 'ENTP具有自发性和适应性。许多人认为他们的谈话风格具有挑战性和激励性。在其他人眼中，通常是独立、自主、有创造力、活泼、热情。',
        functions: 'Ne-Ti-Fe-Si，Ni-Te-Fi-Se',
        bestState: '不断扫描周围环境寻找机会。善于提出无中生有的概念与可能性，然后对其进行战略性分析。',
        growth: '如果不发展思考功能，可能会三分钟热度。压力大时，会被细节淹没。',
        features: '富有创造力、想象力和聪明。分析、逻辑、理性和客观。'
    },
    'ISTP': {
        type: 'ISTP',
        othersSee: 'ISTP希望每个人都得到平等对待，通常会容忍各种行为。在其他人眼中，表现为适应性强、自信、独立。',
        functions: 'Ti-Se-Ni-Fe, Te-Si-Ne-Fi',
        bestState: 'ISTP会仔细观察周围发生的事情。一旦有需要，他们就会迅速找到问题的核心，并以最高的效率解决问题。',
        growth: '如果思考力没得到发展，行动可能只是对眼前需求的草率回应。压力大时，可能会爆发出不恰当的情绪表现。',
        features: '独立客观的批评家。实际而现实，人狠话不多。'
    },
    'ENFJ': {
        type: 'ENFJ',
        othersSee: 'ENFJ精力充沛，热情洋溢。他们倾听并支持他人。在其他人眼中，表现为善于交际、反应敏捷、有说服力。',
        functions: 'Fe-Ni-Se-Ti，Fi-Ne-Si-Te',
        bestState: 'ENFJ与他人的关系非常密切，他们能用同理心迅速理解他人的情感需求。他们经常扮演催化剂的角色，激发出他人的最佳潜能。',
        growth: '如果不发展直觉功能，可能看不到各种可能性。压力大时，可能会突然一反常态地对他人挑剔和找茬。',
        features: '热情、富有同情心。富有想象力和创造力。'
    },
    'ENTJ': {
        type: 'ENTJ',
        othersSee: 'ENTJ喜欢与人进行激励性的互动。人们通常把ENTJ看作直接、具有挑战性、果断、公正。',
        functions: 'Te-Ni-Se-Fi，Ti-Ne-Si-Fe',
        bestState: 'ENTJ是天生的领导者和组织建设者。他们善于发现不合逻辑和效率低下的程序，并有强烈的冲动去纠正它们。',
        growth: '如果不发展直觉，决策可能变得独裁。压力大时，会被自我怀疑所淹没，感到孤独和不被欣赏。',
        features: '逻辑严密、客观批判。创新的理论家和规划者。'
    },
    'ESTP': {
        type: 'ESTP',
        othersSee: 'ESTP热爱生活、沉浸其中。在其他人眼中，表现为活泼、爱玩、意气风发的冒险家、务实的问题解决者。',
        functions: 'Se-Ti-Fe-Ni，Si-Te-Fi-Ne',
        bestState: 'ESTP是精力充沛的问题解决者，能创造性地应对环境中的挑战。他们头脑灵活，适应能力强，能把相互冲突的派别团结在一起。',
        growth: '如果不发展思考能力，可能难以确定优先次序。压力大时，可能会根据随机观察做出负面推断。',
        features: '善于观察。实际而现实，直率、果断。'
    },
    'INFJ': {
        type: 'INFJ',
        othersSee: 'INFJ只与自己信任的人分享内心的直觉。在他人眼中，表现为私密、神秘、强烈而有个性。',
        functions: 'Ni-Fe-Ti-Se, Ne-Fi-Te-Si',
        bestState: '具有凭直觉理解复杂含义和人际关系的天赋。将这种理解力与动力结合，实施改善生活的宏观计划。',
        growth: '如果不发展情感功能，洞察力和创造力就会被锁在内心深处。压力大时，可能会沉迷于感官活动（如暴饮暴食）。',
        features: '洞察力、创造力和远见卓识。理想主义、深度忠于自己的价值观。'
    },
    'ISTJ': {
        type: 'ISTJ',
        othersSee: 'ISTJ踏实工作，按时履行承诺。别人通常认为他们冷静、矜持、连贯有序、重视传统。',
        functions: 'Si-Te-Fi-Ne，Se-Ti-Fe-Ni',
        bestState: '具有强烈的责任感，通常喜欢单独工作并对结果负责。能力和责任感对ISTJ非常重要。',
        growth: '如果思考力没得到发展，可能只专注于自己的内部数据。压力大时，会陷入对未来的负面可能性的想象中。',
        features: '实用、合理、现实。逻辑性和分析性，重视标准程序。'
    },
    'ENFP': {
        type: 'ENFP',
        othersSee: 'ENFP通常活泼好动，善于交际。其他人通常认为ENFP有个性、有洞察力、有说服力、热情。',
        functions: 'Ne-Fi-Te-Si，Ni-Fe-Ti-Se',
        bestState: '把生活看成是充满令人兴奋的可能性的创造性冒险。对人和世界有着非同寻常的洞察力。',
        growth: '如果不发展情感功能，可能会不断燃烧热情却从未投入精力实现。压力大时，会被细节淹没。',
        features: '强烈的好奇心、富有创造力。热情、友好、有爱心。'
    },
    'ESFP': {
        type: 'ESFP',
        othersSee: 'ESFP奔放、热情、吸引着他人。在其他人眼中，表现为足智多谋、生性活泼、爱玩、自发。',
        functions: 'Se-Fi-Te-Ni，Si-Fe-Ti-Ne',
        bestState: '热爱生活，活在当下。是优秀的团队合作者，以最大的乐趣和最小的麻烦完成任务。',
        growth: '如果不发展情感功能，可能会被当下发生的事情所吸引而没有评估机制。压力大时，会被消极和毫无根据的可能性所淹没。',
        features: '善于观察，实际、现实。慷慨、乐观、温暖。'
    },
    'INTJ': {
        type: 'INTJ',
        othersSee: 'INTJ冷静、果断和自信。在其他人眼中，表现为私密、保守、独创、独立。',
        functions: 'Ni-Te-Fi-Se, Ne-Ti-Fe-Si',
        bestState: '对未来的可能性有清晰的认识，有动力和组织能力去实现自己的想法。建立全局思维，制定战略目标。',
        growth: '如果没发展思考，可能没有可靠方法将洞察转化为目标。压力大时，可能过度沉迷于感官活动。',
        features: '富有洞察力的综合者。超然、客观、简洁明了。'
    },
    'ESFJ': {
        type: 'ESFJ',
        othersSee: 'ESFJ通过与他人的互动而充满活力。在其他人眼中，表现为善于交际、外向、有组织、致力于维护传统。',
        functions: 'Fe-Si-Ne-Ti，Fi-Se-Ni-Te',
        bestState: '喜欢组织人和环境，然后与他人合作完成任务。认真负责、重视安全感和稳定性。',
        growth: '如果不发展感官能力，可能会在完全了解情况前就下结论。压力大时，可能会对自己和他人的批评一反常态。',
        features: '实际、现实、始终如一。热情、富有同情心。'
    },
    'INFP': {
        type: 'INFP',
        othersSee: 'INFP具有很强的适应性和灵活性，通常有所保留。在其他人眼中，表现为敏感、内省、复杂、有个性。',
        functions: 'Fi-Ne-Si-Te，Fe-Ni-Se-Ti',
        bestState: '有一个内在的价值观核心指导互动和决策。希望所从事的工作促进成长和内在发展。',
        growth: '如果不发展直觉，可能发现很难将价值观转化为行动。压力大时，可能会怀疑能力，变得过于挑剔。',
        features: '好奇心、创造力。理想主义，忠于自己的想法，深切关怀他人。'
    },
    'ISFJ': {
        type: 'ISFJ',
        othersSee: 'ISFJ把他人的需要放在自己之前。在他人眼中，表现为安静、严肃、体贴、守护传统。',
        functions: 'Si-Fe-Ti-Ne, Se-Fi-Te-Ni',
        bestState: '可靠体贴，对联系的人和团体尽心尽力。认真对待角色和责任，建立有序秩序。',
        growth: '如果不发展情感，可能只关注印象和记忆。压力大时，会陷入对负面可能性的想象中。',
        features: '实际、现实、具体明确。善良而敏感，重视和谐。'
    }
};
