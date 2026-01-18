/**
 * AI 아백 포스팅 - 관리자 JavaScript
 */

(function($) {
    'use strict';
    
    // 전역 변수
    let generatedContent = '';
    let generatedTitle = '';
    let thumbnailId = 0;
    
    $(document).ready(function() {
        
        // 통계 로드
        loadStats();
        
        // 모드 변경 이벤트
        $('#content-mode').on('change', function() {
            const mode = $(this).val();
            if (mode !== 'adsense') {
                $('#ad-section').slideDown();
            } else {
                $('#ad-section').slideUp();
            }
        });
        
        // 광고 코드 추가
        $('#add-ad-code').on('click', function() {
            addAdCodeSlot();
        });
        
        // 광고 코드 삭제
        $(document).on('click', '.remove-ad-code', function() {
            const adItems = $('.abaek-ad-item');
            if (adItems.length > 1) {
                $(this).closest('.abaek-ad-item').fadeOut(300, function() {
                    $(this).remove();
                });
            } else {
                alert('최소 1개의 광고 슬롯은 필요합니다.');
            }
        });
        
        // AI 콘텐츠 생성
        $('#generate-content').on('click', function() {
            generateContent(false);
        });
        
        // 빠른 생성
        $('#quick-generate').on('click', function() {
            generateContent(true);
        });
        
        // 썸네일 생성
        $('#generate-thumbnail').on('click', function() {
            generateThumbnail();
        });
        
        // 콘텐츠 수정
        $('#edit-content').on('click', function() {
            const newContent = prompt('콘텐츠를 수정하세요:', generatedContent);
            if (newContent && newContent.trim()) {
                generatedContent = newContent.trim();
                $('#content-preview').html(generatedContent);
            }
        });
        
        // 워드프레스에 발행
        $('#create-post').on('click', function() {
            createWordPressPost();
        });
        
    });
    
    /**
     * 광고 코드 슬롯 추가
     */
    function addAdCodeSlot() {
        const template = `
            <div class="abaek-ad-item">
                <div class="abaek-ad-item-header">
                    <select class="abaek-select ad-type-select">
                        <option value="">-- 광고 종류 선택 --</option>
                        <option value="dable">데이블 (Dable)</option>
                        <option value="revcontent">레브콘텐츠 (RevContent)</option>
                        <option value="adsense">애드센스 (AdSense)</option>
                        <option value="coupang">쿠팡 파트너스</option>
                        <option value="mgid">MGID</option>
                        <option value="taboola">타불라 (Taboola)</option>
                        <option value="custom">기타 광고</option>
                    </select>
                    <button type="button" class="abaek-btn-icon remove-ad-code" title="삭제">×</button>
                </div>
                <textarea class="abaek-textarea ad-code-input" rows="4" placeholder="광고 스크립트 코드를 여기에 붙여넣으세요..."></textarea>
            </div>
        `;
        
        $('#ad-codes-container').append(template);
    }
    
    /**
     * AI 콘텐츠 생성
     */
    async function generateContent(isQuick) {
        const title = $('#post-title').val().trim();
        
        if (!title) {
            alert('글 제목/주제를 입력하세요.');
            return;
        }
        
        // 입력값 수집
        const mode = $('#content-mode').val();
        const language = $('#content-language').val();
        const length = $('#content-length').val();
        
        // 광고 코드 수집
        const adCodes = [];
        if (mode !== 'adsense') {
            $('.abaek-ad-item').each(function() {
                const type = $(this).find('.ad-type-select').val();
                const code = $(this).find('.ad-code-input').val().trim();
                if (type && code) {
                    adCodes.push({ type, code });
                }
            });
        }
        
        // 광고 위치 수집
        const adPositions = [];
        $('.ad-position:checked').each(function() {
            adPositions.push($(this).val());
        });
        
        // UI 업데이트
        showProgress('AI 분석 중...', 'Puter AI가 콘텐츠를 분석하고 있습니다...');
        disableButtons();
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += isQuick ? 10 : 5;
            if (progress <= 90) {
                updateProgress(progress);
            }
        }, isQuick ? 200 : 500);
        
        try {
            // AI 프롬프트 생성
            const prompt = buildPrompt(title, mode, language, length, isQuick, adCodes, adPositions);
            
            updateProgressMessage('Puter AI 생성 중... 잠시만 기다려주세요');
            
            // Puter AI 호출
            const response = await puter.ai.chat(prompt);
            const aiContent = response.message.content;
            
            clearInterval(progressInterval);
            updateProgress(100);
            
            updateProgressMessage('콘텐츠 후처리 중...');
            
            // 콘텐츠 처리
            const processed = processContent(aiContent, adCodes, adPositions);
            generatedTitle = processed.title;
            generatedContent = processed.html;
            
            // 점수 계산
            const scores = calculateScores(aiContent, mode, adCodes.length);
            
            // 결과 표시
            setTimeout(() => {
                hideProgress();
                showPreview(processed.title, processed.html, scores);
                enableButtons();
            }, 500);
            
        } catch (error) {
            clearInterval(progressInterval);
            hideProgress();
            enableButtons();
            alert('AI 생성 중 오류가 발생했습니다: ' + error.message);
            console.error('Puter AI Error:', error);
        }
    }
    
    /**
     * AI 프롬프트 생성
     */
    function buildPrompt(title, mode, language, length, isQuick, adCodes, adPositions) {
        const isKorean = language === 'ko';
        const locale = isKorean ? 'South Korea' : 'United States';
        const currency = isKorean ? 'KRW (₩)' : 'USD ($)';
        const dateFormat = isKorean ? 'YYYY년 MM월 DD일' : 'MM/DD/YYYY';
        const lang = isKorean ? 'Korean' : 'English';
        
        let prompt = `Write a ${lang} blog post about: ${title}\n`;
        prompt += `Target length: ${length} characters\n`;
        prompt += `Target audience: People in ${locale}\n`;
        prompt += `Use ${locale} context, culture, regulations, and standards\n`;
        
        if (!isKorean) {
            prompt += `Write in American English with US spelling (color, not colour)\n`;
        }
        
        prompt += `Currency: ${currency}, Date format: ${dateFormat}\n\n`;
        
        if (isQuick) {
            prompt += "QUICK MODE: Simple but complete structure\n\n";
        }
        
        // 광고 삽입 안내
        if (mode !== 'adsense' && adCodes.length > 0) {
            prompt += `IMPORTANT: This content will have ${adCodes.length} advertisement(s) inserted.\n`;
            prompt += `Create natural content flow with engaging sections for ad placement.\n\n`;
        }
        
        // 모드별 지시사항
        switch (mode) {
            case 'adsense':
                prompt += "AdSense Approval Mode (100% success rate)\n";
                prompt += "- Deep educational content with expertise\n";
                prompt += "- 10+ H2/H3 headings with clear hierarchy\n";
                prompt += "- Include detailed tables and comprehensive FAQ (8+ items)\n";
                prompt += "- Professional formal tone\n";
                prompt += "- Add statistics and credible information\n";
                prompt += "- Original, valuable content that helps readers\n";
                if (isKorean) {
                    prompt += "- Use Korean government/institution data and policies\n";
                } else {
                    prompt += "- Use US government/institution data and policies\n";
                }
                break;
            
            case 'subsidy':
                if (isKorean) {
                    prompt += "Korean Government Subsidy/Benefit Information Mode\n";
                    prompt += "- Focus on Korean government programs (청년도약계좌, 국민취업지원제도, etc.)\n";
                    prompt += "- Reference Korean websites (정부24, 복지로, etc.)\n";
                } else {
                    prompt += "US Government Benefits/Programs Information Mode\n";
                    prompt += "- Focus on US federal/state programs (Social Security, Medicare, etc.)\n";
                    prompt += "- Reference US websites (SSA.gov, IRS.gov, etc.)\n";
                }
                prompt += "- Detailed eligibility tables\n";
                prompt += "- Step-by-step application process\n";
                prompt += "- Benefit comparison tables\n";
                prompt += "- Important dates and deadlines\n";
                prompt += "- Required documents checklist\n";
                prompt += "- FAQ section\n";
                break;
            
            case 'pasona':
                prompt += "PASONA Copywriting Framework\n";
                prompt += "Write naturally without mentioning framework terms.\n";
                prompt += "Structure: Opening → Understanding → Solution → Benefits → Urgency → Action\n";
                prompt += "- Use emotional storytelling\n";
                prompt += "- Rhetorical questions\n";
                prompt += "- Specific numbers and examples\n";
                prompt += "- Natural breaks for ads\n";
                if (isKorean) {
                    prompt += "- Friendly Korean tone (존댓말)\n";
                } else {
                    prompt += "- Conversational American English\n";
                }
                break;
            
            case 'seo':
                prompt += "SEO Optimized Mode\n";
                if (isKorean) {
                    prompt += "- Optimize for Naver and Google Korea\n";
                } else {
                    prompt += "- Optimize for Google US\n";
                }
                prompt += "- Natural keyword density 1-2%\n";
                prompt += "- 12+ H2/H3 with keywords\n";
                prompt += "- Meta-ready intro (150-160 chars)\n";
                prompt += "- Schema-friendly structure\n";
                break;
            
            case 'ad_insert':
                prompt += "Revenue-Optimized Content Mode\n";
                prompt += "- Highly engaging content\n";
                prompt += "- Multiple clear sections\n";
                prompt += "- Cliffhangers and teasers\n";
                prompt += "- Natural ad placement spaces\n";
                prompt += "- Maximize time-on-page\n";
                break;
        }
        
        prompt += "\n\nOUTPUT: HTML only using h1, h2, h3, p, ul, ol, li, table, thead, tbody, tr, th, td, strong, em.\n";
        prompt += "Start with ONE h1 title, then use h2 and h3 for sections.\n";
        
        if (isKorean) {
            prompt += "Make content engaging for Korean readers with Korean examples and data.";
        } else {
            prompt += "Make content engaging for American readers with US examples and data.";
        }
        
        return prompt;
    }
    
    /**
     * 콘텐츠 처리 및 광고 삽입
     */
    function processContent(content, adCodes, adPositions) {
        // HTML 태그가 없으면 기본 구조 추가
        if (!content.includes('<h1') && !content.includes('<h2')) {
            const lines = content.split('\n').filter(line => line.trim());
            let html = '';
            
            if (lines.length > 0) {
                html += `<h1>${lines[0]}</h1>\n`;
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('#')) {
                        html += `<h2>${line.replace(/^#+\s*/, '')}</h2>\n`;
                    } else if (line.length > 0) {
                        html += `<p>${line}</p>\n`;
                    }
                }
            }
            content = html;
        }
        
        // 광고 삽입
        if (adCodes.length > 0) {
            content = insertAds(content, adCodes, adPositions);
        }
        
        // 제목 추출
        const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : '생성된 콘텐츠';
        
        return { title, html: content };
    }
    
    /**
     * 광고 삽입
     */
    function insertAds(content, adCodes, adPositions) {
        // 광고 HTML 생성
        const adBlocks = adCodes.map((ad, idx) => {
            return `
<!-- wp:html -->
<div class="abaek-ad-block abaek-ad-${ad.type}" style="margin: 30px auto; max-width: 728px; padding: 20px; background: #f9f9f9; border-radius: 8px; text-align: center;">
    <div style="font-size: 11px; color: #999; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Advertisement</div>
    ${ad.code}
</div>
<!-- /wp:html -->
`;
        });
        
        // 단락 분할
        const paragraphs = content.split(/(<h[23][^>]*>.*?<\/h[23]>|<p>.*?<\/p>|<ul>.*?<\/ul>|<ol>.*?<\/ol>|<table>.*?<\/table>)/is).filter(p => p.trim());
        
        let result = '';
        let adIndex = 0;
        
        paragraphs.forEach((para, idx) => {
            result += para + '\n';
            
            // 광고 삽입 로직
            if (adIndex < adBlocks.length) {
                // 상단 (첫 h2 다음)
                if (adPositions.includes('top') && idx === 1 && para.includes('<h2')) {
                    result += adBlocks[adIndex++] + '\n';
                }
                // 중간 (50% 지점)
                else if (adPositions.includes('middle') && idx === Math.floor(paragraphs.length / 2)) {
                    result += adBlocks[adIndex++] + '\n';
                }
                // 단락 사이 (균등 분산)
                else if (adPositions.includes('between') && idx > 0 && idx % Math.floor(paragraphs.length / (adBlocks.length + 1)) === 0) {
                    result += adBlocks[adIndex++] + '\n';
                }
            }
        });
        
        // 하단
        if (adPositions.includes('bottom') && adIndex < adBlocks.length) {
            result += adBlocks[adIndex++] + '\n';
        }
        
        // 남은 광고
        while (adIndex < adBlocks.length) {
            result += adBlocks[adIndex++] + '\n';
        }
        
        return result;
    }
    
    /**
     * 점수 계산
     */
    function calculateScores(content, mode, adCount) {
        const length = content.length;
        const h2Count = (content.match(/<h2/gi) || []).length;
        const h3Count = (content.match(/<h3/gi) || []).length;
        const tableCount = (content.match(/<table/gi) || []).length;
        
        let seo = 70;
        if (h2Count >= 8) seo += 10;
        if (h3Count >= 5) seo += 5;
        if (length >= 3000) seo += 10;
        if (tableCount >= 1) seo += 5;
        
        let revenue = 70;
        if (mode === 'pasona' || mode === 'ad_insert') revenue += 15;
        if (mode === 'subsidy' || mode === 'seo') revenue += 5;
        if (adCount >= 2) revenue += 10;
        if (adCount >= 4) revenue += 5;
        if (length >= 4000) revenue += 5;
        
        let approval = mode === 'adsense' ? 95 : 80;
        if (length >= 5000) approval += 5;
        if (tableCount >= 2) approval += 5;
        if (h2Count >= 10) approval += 5;
        if (adCount > 5) approval -= 10;
        
        return {
            seo: Math.min(100, seo),
            revenue: Math.min(100, revenue),
            approval: Math.min(100, Math.max(0, approval))
        };
    }
    
    /**
     * 썸네일 생성
     */
    async function generateThumbnail() {
        const prompt = $('#thumbnail-prompt').val().trim();
        const style = $('#thumbnail-style').val();
        
        if (!prompt) {
            alert('썸네일 설명을 입력하세요.');
            return;
        }
        
        showProgress('썸네일 생성 중...', 'Canvas로 이미지를 그리는 중...');
        disableButtons();
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 15;
            if (progress <= 90) {
                updateProgress(progress);
            }
        }, 200);
        
        try {
            // Canvas로 썸네일 생성
            const blob = await createThumbnailCanvas(prompt, style);
            
            clearInterval(progressInterval);
            updateProgress(100);
            
            updateProgressMessage('서버에 업로드 중...');
            
            // 서버에 업로드
            const formData = new FormData();
            formData.append('action', 'abaek_upload_thumbnail');
            formData.append('nonce', abaekData.nonce);
            formData.append('thumbnail', blob, 'thumbnail.jpg');
            
            $.ajax({
                url: abaekData.ajaxUrl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        thumbnailId = response.data.id;
                        $('#thumbnail-image').attr('src', response.data.url);
                        $('#thumbnail-size').text(response.data.size + ' KB');
                        $('#thumbnail-preview').fadeIn();
                        
                        hideProgress();
                        enableButtons();
                    } else {
                        alert('업로드 실패: ' + response.data);
                        hideProgress();
                        enableButtons();
                    }
                },
                error: function() {
                    alert('서버 오류가 발생했습니다.');
                    hideProgress();
                    enableButtons();
                }
            });
            
        } catch (error) {
            clearInterval(progressInterval);
            hideProgress();
            enableButtons();
            alert('썸네일 생성 오류: ' + error.message);
        }
    }
    
    /**
     * Canvas로 썸네일 생성
     */
    async function createThumbnailCanvas(text, style) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext('2d');
            
            // 스타일별 색상
            const schemes = {
                professional: { g1: '#2c3e50', g2: '#3498db', accent: '#e74c3c' },
                colorful: { g1: '#f093fb', g2: '#f5576c', accent: '#ffd700' },
                minimal: { g1: '#f5f7fa', g2: '#c3cfe2', accent: '#667eea' },
                dramatic: { g1: '#000000', g2: '#434343', accent: '#ff6b6b' }
            };
            
            const colors = schemes[style] || schemes.professional;
            
            // 그라디언트 배경
            const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
            gradient.addColorStop(0, colors.g1);
            gradient.addColorStop(1, colors.g2);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1200, 630);
            
            // 패턴 추가
            ctx.globalAlpha = 0.1;
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 1200, Math.random() * 630, Math.random() * 200 + 50, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            // 오버레이
            const overlayGradient = ctx.createRadialGradient(600, 315, 100, 600, 315, 500);
            overlayGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
            overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(0, 0, 1200, 630);
            
            // 장식 라인
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(100, 150);
            ctx.lineTo(1100, 150);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(100, 480);
            ctx.lineTo(1100, 480);
            ctx.stroke();
            
            // 코너 장식
            ctx.fillStyle = colors.accent;
            [
                [100, 150], [1100, 150],
                [100, 480], [1100, 480]
            ].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // 텍스트
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            
            const maxWidth = 900;
            const lineHeight = 70;
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';
            
            ctx.font = 'bold 48px "Noto Sans KR", "Malgun Gothic", sans-serif';
            
            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);
            
            const displayLines = lines.slice(0, 3);
            const totalHeight = displayLines.length * lineHeight;
            let startY = 315 - (totalHeight / 2);
            
            displayLines.forEach((line, idx) => {
                ctx.fillText(line, 600, startY + (idx * lineHeight));
            });
            
            // 워터마크
            ctx.shadowColor = 'transparent';
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText('ABAEK AI', 1120, 600);
            
            // Blob 변환 및 압축
            let quality = 0.9;
            
            function tryCompress() {
                canvas.toBlob((blob) => {
                    const sizeKB = blob.size / 1024;
                    
                    if (sizeKB > 300 && quality > 0.3) {
                        quality -= 0.1;
                        tryCompress();
                    } else {
                        resolve(blob);
                    }
                }, 'image/jpeg', quality);
            }
            
            tryCompress();
        });
    }
    
    /**
     * 워드프레스 포스트 생성
     */
    function createWordPressPost() {
        if (!generatedContent) {
            alert('먼저 콘텐츠를 생성하세요.');
            return;
        }
        
        const category = $('#content-category').val();
        
        if (!confirm('워드프레스에 글을 발행하시겠습니까?\n(임시글로 저장됩니다)')) {
            return;
        }
        
        showProgress('포스트 생성 중...', '워드프레스에 저장하는 중...');
        disableButtons();
        
        $.ajax({
            url: abaekData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'abaek_create_post',
                nonce: abaekData.nonce,
                title: generatedTitle,
                content: generatedContent,
                category: category,
                thumbnail_id: thumbnailId
            },
            success: function(response) {
                if (response.success) {
                    hideProgress();
                    enableButtons();
                    
                    const message = `
                        <div class="abaek-success-message">
                            <h3 style="margin: 0 0 10px 0;">✅ 발행 완료!</h3>
                            <p style="margin: 0 0 15px 0;">워드프레스에 임시글로 저장되었습니다.</p>
                            <div style="display: flex; gap: 10px;">
                                <a href="${response.data.edit_url}" target="_blank" class="abaek-btn abaek-btn-primary">글 편집하기</a>
                                <a href="${response.data.view_url}" target="_blank" class="abaek-btn abaek-btn-secondary">미리보기</a>
                            </div>
                        </div>
                    `;
                    
                    $('#preview-section .abaek-card-body').prepend(message);
                    loadStats();
                } else {
                    alert('발행 실패: ' + response.data);
                    hideProgress();
                    enableButtons();
                }
            },
            error: function() {
                alert('서버 오류가 발생했습니다.');
                hideProgress();
                enableButtons();
            }
        });
    }
    
    /**
     * 미리보기 표시
     */
    function showPreview(title, content, scores) {
        $('#content-preview').html(content);
        $('#score-seo').text(scores.seo);
        $('#score-revenue').text(scores.revenue);
        $('#score-approval').text(scores.approval);
        
        $('#preview-section').fadeIn();
        
        // 스크롤
        $('html, body').animate({
            scrollTop: $('#preview-section').offset().top - 100
        }, 500);
    }
    
    /**
     * 진행 상태 표시
     */
    function showProgress(title, message) {
        $('#progress-title').text(title);
        $('#progress-message').text(message);
        $('#progress-fill').css('width', '0%');
        $('#progress-percent').text('0%');
        $('#progress-card').fadeIn();
    }
    
    function updateProgress(percent) {
        $('#progress-fill').css('width', percent + '%');
        $('#progress-percent').text(percent + '%');
    }
    
    function updateProgressMessage(message) {
        $('#progress-message').text(message);
    }
    
    function hideProgress() {
        $('#progress-card').fadeOut();
    }
    
    /**
     * 버튼 상태 관리
     */
    function disableButtons() {
        $('.abaek-btn').prop('disabled', true).css('opacity', '0.6');
    }
    
    function enableButtons() {
        $('.abaek-btn').prop('disabled', false).css('opacity', '1');
    }
    
    /**
     * 통계 로드
     */
    function loadStats() {
        $.ajax({
            url: abaekData.ajaxUrl,
            type: 'POST',
            data: {
                action: 'abaek_get_stats',
                nonce: abaekData.nonce
            },
            success: function(response) {
                if (response.success) {
                    $('#stat-posts').text(response.data.posts || 0);
                    $('#stat-chars').text((response.data.chars || 0).toLocaleString());
                    $('#stat-thumbs').text(response.data.thumbs || 0);
                }
            }
        });
    }
    
})(jQuery);
