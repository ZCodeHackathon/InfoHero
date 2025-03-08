from flask import Flask, request, jsonify
#import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForCausalLM
import torch
#from transformers import RobertaTokenizerFast, TFRobertaForSequenceClassification, pipeline
#from huggingface_hub import login
#import tensorflow as tf

#login(token="")
#tokenizer = RobertaTokenizerFast.from_pretrained("arpanghoshal/EmoRoBERTa")
#model = TFRobertaForSequenceClassification.from_pretrained("arpanghoshal/EmoRoBERTa")

#emotion = pipeline('sentiment-analysis',
#                    model='arpanghoshal/EmoRoBERTa')

#emotion_labels = emotion("jestem zły")
#print(emotion_labels)


tokenizer = AutoTokenizer.from_pretrained("dkleczek/Polish-Hate-Speech-Detection-Herbert-Large")
model = AutoModelForSequenceClassification.from_pretrained("dkleczek/Polish-Hate-Speech-Detection-Herbert-Large")

tokenizer2 = AutoTokenizer.from_pretrained("ArkadiusDS/polbert-base-polish-disinfo")
model2 = AutoModelForSequenceClassification.from_pretrained("ArkadiusDS/polbert-base-polish-disinfo")


app = Flask(__name__)


def classify_text(text, mod, tok):
    inputs = tok(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = mod(**inputs)
    logits = outputs.logits
    probabilities = torch.softmax(logits, dim=-1)
    predicted_class = torch.argmax(probabilities, dim=-1).item()
    return predicted_class, probabilities[0].tolist()



@app.route('/classify', methods=['POST'])
def classify():
    data = request.json
    type = data.get('type', '')
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    if not type:
        return jsonify({'error': 'No model type provided'}), 400

    if type == 'fake_news':
        predicted_class, probabilities = classify_text(text, model2, tokenizer2)
    elif type == 'hate_speech':
        predicted_class, probabilities = classify_text(text, model, tokenizer)
    else:
        return jsonify({'error': 'Invalid model type'}), 400

    if(probabilities[1] > 0.8):
        predicted_class = 1
    else:
        predicted_class = 0

    return jsonify({'predicted_class': predicted_class})


sample_text = "czlowiek to koks"

predicted_class, probabilities = classify_text(sample_text, model, tokenizer)
print(f'Predicted class: {predicted_class}')
print(f'Probabilities: {probabilities}')


predicted_class, probabilities = classify_text(sample_text, model2, tokenizer2)
print(f'Predicted class: {predicted_class}')
print(f'Probabilities: {probabilities}')

#text = "life is great"
#predicted_class, probabilities = classify_text(text)
#print('predicted_class'+ str(predicted_class)+ 'probabilities'+ str(probabilities))

if __name__ == '__main__':
    app.run()


