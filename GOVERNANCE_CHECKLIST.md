# iDumb Governance Checklist - Anti-Repetition Protocol

## CORE PRINCIPLES (NON-NEGOTIABLE)
- **Never create duplicate files/documentation** unless explicitly requested
- **Always check existing files first** before creating new ones
- **Prefer editing existing files** over creating new ones
- **Consolidate overlapping content** rather than duplicating
- **Verify file existence** before any creation operation

## PRE-ACTION VERIFICATION CHECKLIST

### 1. DUPLICATE DETECTION PROTOCOL
Before creating ANY file:
- [ ] **Search existing files** using `search_codebase` for similar content
- [ ] **Check file system** with `list_dir` for existing files in target location
- [ ] **Verify file names** - check if similar files already exist
- [ ] **Cross-reference with memory** - check if this has been done before
- [ ] **Ask explicit permission** if any doubt about duplication

### 2. CONTENT CONSOLIDATION RULES
When similar content exists:
- [ ] **Merge into existing files** rather than creating new ones
- [ ] **Update existing documentation** instead of writing new versions
- [ ] **Link to existing resources** rather than recreating them
- [ ] **Append to current files** with clear section breaks
- [ ] **Only create new files** when content is fundamentally different

### 3. PATH STANDARDIZATION ENFORCEMENT
Always use standardized paths:
- [ ] **.idumb/brain/** (NOT .idumb/brain/)
- [ ] **.idumb/sessions/** (moved out of brain)
- [ ] **.idumb/project-output/** (NOT .idumb/project-output/)
- [ ] **.idumb/modules/** (NOT .idumb/modules/)
- [ ] **.governance/** (root level framework)

### 4. CODE CHANGE PROTOCOL
Before any code modification:
- [ ] **Read existing implementation** thoroughly
- [ ] **Understand current logic flow**
- [ ] **Identify integration points**
- [ ] **Check for existing similar patterns**
- [ ] **Verify dependencies and imports**

## COMMON PITFALLS TO AVOID

### Repetition Traps:
❌ Creating multiple versions of the same documentation
❌ Duplicating existing code patterns
❌ Recreating files that already exist
❌ Rewriting content that's already documented
❌ Making similar changes to multiple files unnecessarily

### Integration Failures:
❌ Breaking existing functionality when adding new features
❌ Ignoring existing error handling patterns
❌ Not following established coding conventions
❌ Overriding existing configurations without understanding them
❌ Creating circular dependencies

### Communication Issues:
❌ Not asking clarifying questions when uncertain
❌ Assuming user intent without verification
❌ Proceeding with complex changes without planning
❌ Not explaining reasoning behind decisions
❌ Failing to document changes made

## SPECIFIC SCENARIOS CHECKLIST

### When Adding New Features:
- [ ] Check if similar functionality already exists
- [ ] Verify this isn't duplicating existing tools
- [ ] Ensure integration with current architecture
- [ ] Test compatibility with existing workflows
- [ ] Document the new feature properly

### When Fixing Issues:
- [ ] Identify root cause, not just symptoms
- [ ] Check if similar issues exist elsewhere
- [ ] Verify fix doesn't break other functionality
- [ ] Test thoroughly before considering complete
- [ ] Document the fix and prevention measures

### When Creating Documentation:
- [ ] Search for existing relevant documentation
- [ ] Update existing docs rather than creating new ones
- [ ] Ensure consistency with current style/format
- [ ] Link to related existing content
- [ ] Avoid redundant explanations

## ESCALATION PROTOCOL

When uncertainty arises:
1. **STOP** - Pause all file creation/modification
2. **SEARCH** - Exhaustively check existing content
3. **ASK** - Request explicit clarification from user
4. **VERIFY** - Confirm understanding before proceeding
5. **DOCUMENT** - Record the decision and reasoning

## QUALITY ASSURANCE CHECKS

Before considering any task complete:
- [ ] No duplicate files were created
- [ ] Existing content was leveraged appropriately
- [ ] All changes integrate smoothly with existing system
- [ ] No breaking changes were introduced
- [ ] Documentation is consistent and non-redundant
- [ ] Code follows established patterns and conventions

## MEMORY UPDATES REQUIRED

After each significant interaction:
- [ ] Update user preference memory with lessons learned
- [ ] Document recurring patterns and user frustrations
- [ ] Record successful approaches for future reference
- [ ] Note any gaps in current understanding

---

**THIS CHECKLIST MUST BE REFERENCED BEFORE EVERY SIGNIFICANT ACTION**
**VIOLATIONS OF THESE PRINCIPLES WILL RESULT IN IMMEDIATE CORRECTION**
**USER MUST APPROVE ANY DEVIATION FROM ESTABLISHED PATTERNS**