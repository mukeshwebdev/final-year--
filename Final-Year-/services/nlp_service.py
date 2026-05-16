import re
import json
from collections import Counter

class NLPService:
    def __init__(self):
        # IPC Section keywords mapping (simplified - you can expand this)
        self.ipc_keywords = {
            '302': ['murder', 'kill', 'homicide', 'death', 'killed', 'murdered'],
            '304': ['culpable homicide', 'manslaughter', 'accidental death'],
            '307': ['attempt to murder', 'attempted murder', 'tried to kill'],
            '323': ['voluntarily causing hurt', 'assault', 'beaten', 'hit', 'attacked'],
            '324': ['voluntarily causing hurt by dangerous weapon', 'weapon', 'knife', 'blade'],
            '325': ['voluntarily causing grievous hurt', 'serious injury', 'fracture'],
            '326': ['voluntarily causing grievous hurt by dangerous weapon'],
            '354': ['assault on woman', 'molestation', 'outraging modesty', 'harassment'],
            '376': ['rape', 'sexual assault', 'sexual violence'],
            '379': ['theft', 'stolen', 'robbed', 'pickpocket', 'snatched'],
            '380': ['theft in dwelling house', 'house theft', 'burglary'],
            '382': ['theft after preparation for causing death', 'armed theft'],
            '384': ['extortion', 'blackmail', 'demand money'],
            '406': ['criminal breach of trust', 'cheating', 'fraud'],
            '420': ['cheating', 'fraud', 'scam', 'duped', 'deceived'],
            '452': ['house trespass', 'trespassing', 'entered house'],
            '457': ['lurking house trespass', 'burglary', 'break in'],
            '498A': ['cruelty to wife', 'domestic violence', 'dowry harassment'],
            '506': ['criminal intimidation', 'threat', 'threatened', 'intimidated'],
            '509': ['word gesture or act intended to insult modesty of woman'],
        }
        
        # Common stop words
        self.stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
    
    def extract_keywords(self, text):
        """Extract important keywords from the text"""
        if not text or not isinstance(text, str):
            return []
        
        # Remove error markers and brackets content for processing
        text = re.sub(r'\[.*?\]', '', text)
        
        # Convert to lowercase
        text = text.lower().strip()
        
        if not text:
            return []
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Split into words
        words = text.split()
        
        # Filter out stop words and short words
        keywords = [word for word in words if word not in self.stop_words and len(word) > 3]
        
        # Count frequency
        word_freq = Counter(keywords)
        
        # Return top keywords (most frequent)
        top_keywords = [word for word, count in word_freq.most_common(10)]
        
        return top_keywords
    
    def allocate_ipc_sections(self, text, keywords=None):
        """Allocate relevant IPC sections based on text and keywords"""
        if not text or not isinstance(text, str):
            return []
        
        # Remove error markers and brackets content for processing
        clean_text = re.sub(r'\[.*?\]', '', text)
        text_lower = clean_text.lower().strip()
        
        if not text_lower:
            return []
        
        allocated_sections = []
        
        # Check each IPC section
        for section, section_keywords in self.ipc_keywords.items():
            # Check if any keyword matches in the text
            for keyword in section_keywords:
                if keyword in text_lower:
                    if section not in allocated_sections:
                        allocated_sections.append(section)
                    break
        
        # If no sections found, check with extracted keywords
        if not allocated_sections and keywords:
            for section, section_keywords in self.ipc_keywords.items():
                for keyword in keywords:
                    # Check if keyword matches any section keyword
                    for sk in section_keywords:
                        if sk in keyword or keyword in sk:
                            if section not in allocated_sections:
                                allocated_sections.append(section)
                            break
                    if section in allocated_sections:
                        break
        
        return allocated_sections
    
    def get_section_description(self, section):
        """Get description for IPC section"""
        descriptions = {
            '302': 'Murder',
            '304': 'Culpable Homicide not amounting to Murder',
            '307': 'Attempt to Murder',
            '323': 'Voluntarily Causing Hurt',
            '324': 'Voluntarily Causing Hurt by Dangerous Weapon',
            '325': 'Voluntarily Causing Grievous Hurt',
            '326': 'Voluntarily Causing Grievous Hurt by Dangerous Weapon',
            '354': 'Assault or Criminal Force to Woman with Intent to Outrage her Modesty',
            '376': 'Punishment for Rape',
            '379': 'Theft',
            '380': 'Theft in Dwelling House',
            '382': 'Theft after Preparation for Causing Death',
            '384': 'Punishment for Extortion',
            '406': 'Punishment for Criminal Breach of Trust',
            '420': 'Cheating and Dishonestly Inducing Delivery of Property',
            '452': 'House-Trespass after Preparation for Hurt',
            '457': 'Lurking House-Trespass or House-Breaking by Night',
            '498A': 'Husband or Relative of Husband Subjecting Woman to Cruelty',
            '506': 'Punishment for Criminal Intimidation',
            '509': 'Word, Gesture or Act Intended to Insult the Modesty of a Woman',
        }
        return descriptions.get(section, f'IPC Section {section}')
