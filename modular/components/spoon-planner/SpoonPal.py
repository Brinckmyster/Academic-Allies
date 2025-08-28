# SpoonPal Protocol-Compliant Timeline Generator
# Follows ALL locked protocols from Space instructions and LMJ assignments

from datetime import datetime

# Locked LMJ Order and Emoji Assignments (Protocol-Locked)
LOCKED_LMJ_ORDER = [
    {'lmj': 'A', 'emoji': '💊', 'description': 'Morning meds'},
    {'lmj': 'V', 'emoji': '🦾', 'description': 'CPAP prep, wrist brace'},
    {'lmj': 'B', 'emoji': '🍽️', 'description': 'Family scriptures, breakfast'},
    {'lmj': 'G', 'emoji': '🐥', 'description': 'Gosling time'},
    {'lmj': 'N', 'emoji': '📰', 'description': 'News with Mom'},
    {'lmj': 'ME', 'emoji': '🧘', 'description': 'Me time'},
    {'lmj': 'H', 'emoji': '🧺', 'description': 'Hamper/laundry (change clothes, hamper, bathroom)'},
    {'lmj': 'CC', 'emoji': '🛏️', 'description': 'In bed'},
    {'lmj': 'DD', 'emoji': '💨', 'description': 'Breathe, recover'},
    {'lmj': 'EE', 'emoji': '😷', 'description': 'CPAP mask on'},
    {'lmj': 'FF', 'emoji': '🤚', 'description': 'Wrist brace on'},
    {'lmj': 'ZZ', 'emoji': '📵', 'description': 'Device off, crash'}
]

# Locked Status Icons (Protocol-Locked)
ALLOWED_STATUS_ICONS = {
    'complete': '✅',
    'incomplete': '⬜', 
    'partial': '⏳',
    'progress': '🛠️',
    'interrupted': '🚧',
    'skipped': '❌',  # ⏭️ is EXPRESSLY FORBIDDEN
    'rescheduled': '🔄'
}

def generate_protocol_timeline(tasks, spoon_data=None):
    """
    Generate timeline following ALL locked protocols
    
    tasks: list of dicts with keys:
        - time: str (e.g., '0830')
        - ampm: str ('AM' or 'PM') 
        - fixed: bool (True if fixed task)
        - urgent: bool (True if urgent)
        - lmj: str (must match LOCKED_LMJ_ORDER)
        - description: str (with priority in parentheses)
        - spoon_cost: float
        - status: str (key from ALLOWED_STATUS_ICONS)
        - area_notes: str (optional)
        
    spoon_data: dict with spoon calculations
    """
    
    output = []
    
    # Rule A: Timestamp MUST be first line
    timestamp = datetime.now().strftime('%A, %B %d, %Y, %I:%M %p MDT')
    output.append(timestamp)
    output.append("")
    
    # Spoon Section (Prefilled) - MUST be first section
    if spoon_data:
        output.append("**Spoon Section**")
        output.append(f"Baseline: {spoon_data.get('baseline', 20)}")
        output.append(f"Spoons borrowed: {spoon_data.get('borrowed', '[fill]')}")
        output.append(f"Spoons at start: {spoon_data.get('at_start', '[auto-calc]')}")
        output.append(f"Planned spoon cost: {spoon_data.get('planned_cost', '[auto-calc]')}")
        output.append(f"Spoons spent: {spoon_data.get('spent', 0)}")
        output.append(f"Spoons remaining: {spoon_data.get('remaining', '[auto-calc]')}")
        output.append(f"Depletion if all complete: {spoon_data.get('depletion', '[auto-calc]')}")
        output.append(f"Weather: {spoon_data.get('weather', '[fill]')}")
        output.append(f"Check-in: {spoon_data.get('checkin', '[fill]')}")
        output.append("")
    
    # Protocol-Locked Legend (MUST appear above timeline AND in reference section)
    legend = "Fixed 🔒 Flexible ↕️ Urgent 🔥 AM ☀️ PM 🌙 🥄 Spoon Lmj 🎯 Status ✅ Complete ⬜ Incomplete ⏳ Partial 🛠️ Progress 🚧 Interrupted ❌ Skipped 🔄 Rescheduled"
    output.append(legend)
    output.append("")
    
    # Timeline Table Header
    output.append("| Time | Lmj | Task Description | 🥄 | Status | AreaNotes |")
    output.append("|------|-----|------------------|-------|--------|-----------|")
    
    # Sort tasks by locked protocol order
    def sort_tasks(task):
        # Find LMJ order index
        lmj_order = {item['lmj']: i for i, item in enumerate(LOCKED_LMJ_ORDER)}
        lmj_idx = lmj_order.get(task['lmj'], 999)
        
        # Sort by: LMJ order, then time, then AM/PM, then fixed/flexible
        return (
            lmj_idx,
            task['time'],
            0 if task['ampm'] == 'AM' else 1,
            0 if task.get('fixed', False) else 1
        )
    
    sorted_tasks = sorted(tasks, key=sort_tasks)
    
    # Generate timeline rows
    for task in sorted_tasks:
        # Time column: numeric + AM/PM icon + Fixed/Flexible/Urgent icon
        time_icons = []
        time_icons.append('☀️' if task['ampm'] == 'AM' else '🌙')
        if task.get('urgent', False):
            time_icons.append('🔥')
        elif task.get('fixed', False):
            time_icons.append('🔒')
        else:
            time_icons.append('↕️')
            
        time_str = f"{task['time']} {''.join(time_icons)}"
        
        # LMJ column: Letter + locked emoji
        lmj_emoji = next((item['emoji'] for item in LOCKED_LMJ_ORDER if item['lmj'] == task['lmj']), '')
        lmj_str = f"{task['lmj']}{lmj_emoji}"
        
        # Validate status icon
        status_icon = ALLOWED_STATUS_ICONS.get(task['status'], '⬜')
        
        # Build row
        row = f"| {time_str} | {lmj_str} | {task['description']} | {task['spoon_cost']} | {status_icon} | {task.get('area_notes', '')} |"
        output.append(row)
    
    output.append("")
    
    # Reference Section (System Use Only, Always Last)
    output.append("**Reference Section (System Use Only, Always Last)**")
    output.append(legend)  # Legend MUST appear here too
    output.append("- All LMJ assignments follow locked protocol order")
    output.append("- H comes after ME in all timelines") 
    output.append("- Evening routines (N, ME, H, CC, DD, EE, FF, ZZ) cannot move ahead of G")
    output.append("- Any other tasks must be slotted between B and G unless specified")
    output.append("- Legend must always appear above timeline table and in reference section")
    output.append("- Label-RuleDescription.csv and user corrections always referenced for compliance")
    output.append("")
    
    # NONOPE Log (Growth-Only, Always After Reference Section)
    output.append("**NONOPE Log**")
    output.append("- Any drift, unordered LMJs, H before ME, or duplicate BB emojis permanently rejected")
    output.append("- Use of ⏭️ icon for Skipped status is EXPRESSLY FORBIDDEN") 
    output.append("- Any timeline not following locked LMJ order permanently rejected")
    output.append("- Any legend omission or incorrect placement permanently rejected")
    output.append("")
    
    return '\n'.join(output)

# Bathroom Break Protocol Enforcement
def validate_bb_emojis(tasks):
    """Ensure no duplicate BB emojis in same day"""
    bb_emojis = []
    for task in tasks:
        if 'BB' in task.get('lmj', '') or 'bathroom' in task.get('description', '').lower():
            emoji = task.get('emoji', '')
            if emoji in bb_emojis:
                raise ValueError(f"Duplicate BB emoji {emoji} detected - protocol violation")
            bb_emojis.append(emoji)
    return True

# Template Creator Function
def create_daily_template(template_type="weekday"):
    """Create template following locked LMJ order"""
    templates = {
        "weekday": [
            {'time': '0730', 'ampm': 'AM', 'fixed': True, 'lmj': 'A', 'description': 'Morning meds (High)', 'spoon_cost': 2, 'status': 'incomplete'},
            {'time': '0745', 'ampm': 'AM', 'fixed': True, 'lmj': 'V', 'description': 'CPAP prep, wrist brace (High)', 'spoon_cost': 1, 'status': 'incomplete'},
            {'time': '0800', 'ampm': 'AM', 'fixed': True, 'lmj': 'B', 'description': 'Family scriptures, breakfast (High)', 'spoon_cost': 2, 'status': 'incomplete'},
            {'time': '0900', 'ampm': 'AM', 'fixed': False, 'lmj': 'G', 'description': 'Gosling time (Medium)', 'spoon_cost': 2, 'status': 'incomplete'},
            {'time': '0600', 'ampm': 'PM', 'fixed': False, 'lmj': 'N', 'description': 'News with Mom (High)', 'spoon_cost': 1, 'status': 'incomplete'},
            {'time': '0700', 'ampm': 'PM', 'fixed': False, 'lmj': 'ME', 'description': 'Me time (Medium)', 'spoon_cost': 1, 'status': 'incomplete'},
            {'time': '0800', 'ampm': 'PM', 'fixed': False, 'lmj': 'H', 'description': 'Hamper/laundry (Medium)', 'spoon_cost': 1, 'status': 'incomplete'},
            {'time': '0900', 'ampm': 'PM', 'fixed': True, 'lmj': 'CC', 'description': 'In bed (High)', 'spoon_cost': 0, 'status': 'incomplete'},
            {'time': '0915', 'ampm': 'PM', 'fixed': True, 'lmj': 'DD', 'description': 'Breathe, recover (High)', 'spoon_cost': 0, 'status': 'incomplete'},
            {'time': '0930', 'ampm': 'PM', 'fixed': True, 'lmj': 'EE', 'description': 'CPAP mask on (High)', 'spoon_cost': 0, 'status': 'incomplete'},
            {'time': '0945', 'ampm': 'PM', 'fixed': True, 'lmj': 'FF', 'description': 'Wrist brace on (High)', 'spoon_cost': 0, 'status': 'incomplete'},
            {'time': '1000', 'ampm': 'PM', 'fixed': True, 'lmj': 'ZZ', 'description': 'Device off, crash (High)', 'spoon_cost': 0, 'status': 'incomplete'}
        ]
    }
    return templates.get(template_type, [])

# Example usage:
if __name__ == "__main__":
    sample_spoons = {
        'baseline': 20,
        'borrowed': 3,
        'at_start': 17,
        'planned_cost': 10,
        'spent': 0,
        'remaining': 17,
        'depletion': 7,
        'weather': '75°F, clear',
        'checkin': 'Normal fatigue, ready to start'
    }
    
    template_tasks = create_daily_template("weekday")
    timeline_output = generate_protocol_timeline(template_tasks, sample_spoons)
    print(timeline_output)
