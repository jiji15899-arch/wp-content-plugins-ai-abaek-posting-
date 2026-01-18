<?php
/**
 * Plugin Name: AI 아백 포스팅
 * Plugin URI: https://abaek.ai
 * Description: Puter.js 기반 AI 콘텐츠 자동 생성 플러그인 - 애드센스 승인율 100% 보장
 * Version: 1.0.0
 * Author: Abaek Team
 * Author URI: https://abaek.ai
 * License: GPL v2 or later
 * Text Domain: ai-abaek-posting
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ABAEK_VERSION', '1.0.0');
define('ABAEK_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ABAEK_PLUGIN_URL', plugin_dir_url(__FILE__));

class AI_Abaek_Posting {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('wp_ajax_abaek_generate_content', [$this, 'ajax_generate_content']);
        add_action('wp_ajax_abaek_upload_thumbnail', [$this, 'ajax_upload_thumbnail']);
        add_action('wp_ajax_abaek_create_post', [$this, 'ajax_create_post']);
        add_action('wp_ajax_abaek_get_stats', [$this, 'ajax_get_stats']);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'AI 아백 포스팅',
            'AI 아백 포스팅',
            'edit_posts',
            'ai-abaek-posting',
            [$this, 'render_main_page'],
            'dashicons-edit-large',
            25
        );
    }
    
    public function enqueue_scripts($hook) {
        if ('toplevel_page_ai-abaek-posting' !== $hook) {
            return;
        }
        
        // Puter.js
        wp_enqueue_script('puter-js', 'https://js.puter.com/v2/', [], null, true);
        
        // 플러그인 스타일
        wp_enqueue_style(
            'abaek-admin-css',
            ABAEK_PLUGIN_URL . 'assets/admin.css',
            [],
            ABAEK_VERSION
        );
        
        // 플러그인 스크립트
        wp_enqueue_script(
            'abaek-admin-js',
            ABAEK_PLUGIN_URL . 'assets/admin.js',
            ['jquery', 'puter-js'],
            ABAEK_VERSION,
            true
        );
        
        wp_localize_script('abaek-admin-js', 'abaekData', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('abaek_nonce'),
            'pluginUrl' => ABAEK_PLUGIN_URL
        ]);
    }
    
    public function render_main_page() {
        ?>
        <div class="wrap abaek-wrap">
            <div class="abaek-header">
                <h1 class="abaek-title">
                    <span class="abaek-logo">✨</span>
                    AI 아백 포스팅
                </h1>
                <p class="abaek-subtitle">Puter.js AI로 애드센스 승인율 100% 콘텐츠 자동 생성</p>
            </div>
            
            <div class="abaek-container">
                <div class="abaek-main-content">
                    
                    <!-- 콘텐츠 생성 섹션 -->
                    <div class="abaek-card">
                        <div class="abaek-card-header">
                            <h2>📝 콘텐츠 생성</h2>
                        </div>
                        <div class="abaek-card-body">
                            
                            <div class="abaek-form-group">
                                <label for="post-title" class="abaek-label">
                                    <span class="label-icon">🎯</span>
                                    글 제목 / 주제
                                    <span class="label-required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="post-title" 
                                    class="abaek-input" 
                                    placeholder="예: 2026년 청년도약계좌 신청방법 완벽 가이드"
                                >
                                <p class="abaek-help-text">구체적인 주제를 입력하면 더 좋은 결과를 얻을 수 있습니다.</p>
                            </div>
                            
                            <div class="abaek-form-row">
                                <div class="abaek-form-group">
                                    <label for="content-mode" class="abaek-label">
                                        <span class="label-icon">⚙️</span>
                                        생성 모드
                                    </label>
                                    <select id="content-mode" class="abaek-select">
                                        <option value="adsense">💎 애드센스 승인용 (승인율 100%)</option>
                                        <option value="subsidy">💰 지원금 글 생성기 (표/차트)</option>
                                        <option value="pasona">🔥 파소나 수익형 (광고 최적화)</option>
                                        <option value="seo">🚀 SEO 최적화 (검색 유입)</option>
                                        <option value="ad_insert">💸 광고 삽입형 (수익 극대화)</option>
                                    </select>
                                </div>
                                
                                <div class="abaek-form-group">
                                    <label for="content-language" class="abaek-label">
                                        <span class="label-icon">🌍</span>
                                        언어
                                    </label>
                                    <select id="content-language" class="abaek-select">
                                        <option value="ko">🇰🇷 한국어 (대한민국 기준)</option>
                                        <option value="en">🇺🇸 English (미국 기준)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="abaek-form-row">
                                <div class="abaek-form-group">
                                    <label for="content-length" class="abaek-label">
                                        <span class="label-icon">📏</span>
                                        글자 수
                                    </label>
                                    <select id="content-length" class="abaek-select">
                                        <option value="3000">3,000자 (짧음)</option>
                                        <option value="5000" selected>5,000자 (권장)</option>
                                        <option value="8000">8,000자 (상세)</option>
                                        <option value="10000">10,000자 (전문)</option>
                                    </select>
                                </div>
                                
                                <div class="abaek-form-group">
                                    <label for="content-category" class="abaek-label">
                                        <span class="label-icon">📁</span>
                                        카테고리
                                    </label>
                                    <select id="content-category" class="abaek-select">
                                        <option value="">선택 안함</option>
                                        <?php
                                        $categories = get_categories(['hide_empty' => false]);
                                        foreach ($categories as $category) {
                                            echo '<option value="' . esc_attr($category->term_id) . '">' . esc_html($category->name) . '</option>';
                                        }
                                        ?>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- 광고 코드 섹션 -->
                            <div id="ad-section" class="abaek-ad-section" style="display:none;">
                                <div class="abaek-section-header">
                                    <h3>📢 광고 코드 설정</h3>
                                    <button type="button" id="add-ad-code" class="abaek-btn-small abaek-btn-success">
                                        + 광고 추가
                                    </button>
                                </div>
                                
                                <div id="ad-codes-container">
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
                                            <button type="button" class="abaek-btn-icon remove-ad-code" title="삭제">
                                                ×
                                            </button>
                                        </div>
                                        <textarea 
                                            class="abaek-textarea ad-code-input" 
                                            rows="4" 
                                            placeholder="광고 스크립트 코드를 여기에 붙여넣으세요..."
                                        ></textarea>
                                    </div>
                                </div>
                                
                                <div class="abaek-form-group">
                                    <label class="abaek-label">
                                        <span class="label-icon">📍</span>
                                        광고 삽입 위치
                                    </label>
                                    <div class="abaek-checkbox-group">
                                        <label class="abaek-checkbox-label">
                                            <input type="checkbox" class="ad-position" value="top" checked>
                                            <span>상단 (제목 아래)</span>
                                        </label>
                                        <label class="abaek-checkbox-label">
                                            <input type="checkbox" class="ad-position" value="middle" checked>
                                            <span>중간 (본문 중앙)</span>
                                        </label>
                                        <label class="abaek-checkbox-label">
                                            <input type="checkbox" class="ad-position" value="bottom" checked>
                                            <span>하단 (글 끝)</span>
                                        </label>
                                        <label class="abaek-checkbox-label">
                                            <input type="checkbox" class="ad-position" value="between">
                                            <span>단락 사이 (자동 분산)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="abaek-actions">
                                <button type="button" id="generate-content" class="abaek-btn abaek-btn-primary">
                                    <span class="btn-icon">✨</span>
                                    AI 콘텐츠 생성
                                </button>
                                <button type="button" id="quick-generate" class="abaek-btn abaek-btn-secondary">
                                    <span class="btn-icon">⚡</span>
                                    빠른 생성 (10초)
                                </button>
                            </div>
                            
                        </div>
                    </div>
                    
                    <!-- 썸네일 생성 섹션 -->
                    <div class="abaek-card">
                        <div class="abaek-card-header">
                            <h2>🎨 썸네일 생성</h2>
                        </div>
                        <div class="abaek-card-body">
                            
                            <div class="abaek-form-group">
                                <label for="thumbnail-prompt" class="abaek-label">
                                    <span class="label-icon">🖼️</span>
                                    썸네일 설명
                                </label>
                                <textarea 
                                    id="thumbnail-prompt" 
                                    class="abaek-textarea" 
                                    rows="3" 
                                    placeholder="예: 청년도약계좌를 설명하는 밝고 희망찬 이미지"
                                ></textarea>
                            </div>
                            
                            <div class="abaek-form-row">
                                <div class="abaek-form-group">
                                    <label for="thumbnail-style" class="abaek-label">
                                        <span class="label-icon">🎭</span>
                                        스타일
                                    </label>
                                    <select id="thumbnail-style" class="abaek-select">
                                        <option value="professional">전문적</option>
                                        <option value="colorful">화려함</option>
                                        <option value="minimal">미니멀</option>
                                        <option value="dramatic">드라마틱</option>
                                    </select>
                                </div>
                                
                                <div class="abaek-form-group">
                                    <button type="button" id="generate-thumbnail" class="abaek-btn abaek-btn-primary" style="margin-top: 28px;">
                                        <span class="btn-icon">🎨</span>
                                        썸네일 생성
                                    </button>
                                </div>
                            </div>
                            
                            <div id="thumbnail-preview" class="abaek-thumbnail-preview" style="display:none;">
                                <img id="thumbnail-image" src="" alt="Generated Thumbnail">
                                <div class="thumbnail-info">
                                    <span id="thumbnail-size" class="thumbnail-size">0 KB</span>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    
                    <!-- 미리보기 / 결과 섹션 -->
                    <div id="preview-section" class="abaek-card" style="display:none;">
                        <div class="abaek-card-header">
                            <h2>👁️ 콘텐츠 미리보기</h2>
                            <div class="abaek-score-badges">
                                <span class="score-badge score-seo">
                                    SEO: <strong id="score-seo">-</strong>
                                </span>
                                <span class="score-badge score-revenue">
                                    수익: <strong id="score-revenue">-</strong>
                                </span>
                                <span class="score-badge score-approval">
                                    승인: <strong id="score-approval">-</strong>
                                </span>
                            </div>
                        </div>
                        <div class="abaek-card-body">
                            <div id="content-preview" class="abaek-content-preview"></div>
                            
                            <div class="abaek-actions">
                                <button type="button" id="create-post" class="abaek-btn abaek-btn-success">
                                    <span class="btn-icon">📝</span>
                                    워드프레스에 발행하기
                                </button>
                                <button type="button" id="edit-content" class="abaek-btn abaek-btn-secondary">
                                    <span class="btn-icon">✏️</span>
                                    수정하기
                                </button>
                            </div>
                        </div>
                    </div>
                    
                </div>
                
                <!-- 사이드바 -->
                <div class="abaek-sidebar">
                    
                    <!-- 진행 상태 -->
                    <div id="progress-card" class="abaek-card abaek-progress-card" style="display:none;">
                        <div class="abaek-card-body">
                            <div class="progress-icon">⏳</div>
                            <h3 id="progress-title">AI 분석 중...</h3>
                            <div class="abaek-progress-bar">
                                <div id="progress-fill" class="abaek-progress-fill"></div>
                            </div>
                            <p id="progress-percent" class="progress-percent">0%</p>
                            <p id="progress-message" class="progress-message">잠시만 기다려주세요...</p>
                        </div>
                    </div>
                    
                    <!-- 통계 -->
                    <div class="abaek-card">
                        <div class="abaek-card-header">
                            <h3>📊 사용 통계</h3>
                        </div>
                        <div class="abaek-card-body">
                            <div class="abaek-stat-item">
                                <span class="stat-label">생성된 글</span>
                                <span class="stat-value" id="stat-posts">0</span>
                            </div>
                            <div class="abaek-stat-item">
                                <span class="stat-label">총 글자 수</span>
                                <span class="stat-value" id="stat-chars">0</span>
                            </div>
                            <div class="abaek-stat-item">
                                <span class="stat-label">썸네일 생성</span>
                                <span class="stat-value" id="stat-thumbs">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 팁 -->
                    <div class="abaek-card">
                        <div class="abaek-card-header">
                            <h3>💡 사용 팁</h3>
                        </div>
                        <div class="abaek-card-body">
                            <ul class="abaek-tips-list">
                                <li>구체적인 주제를 입력하면 더 정확한 콘텐츠가 생성됩니다</li>
                                <li>애드센스 승인용은 광고 없이 순수 콘텐츠로 작성됩니다</li>
                                <li>5,000자 이상 권장 (SEO 및 승인율 향상)</li>
                                <li>썸네일은 300KB 이하로 자동 최적화됩니다</li>
                            </ul>
                        </div>
                    </div>
                    
                </div>
                
            </div>
        </div>
        <?php
    }
    
    public function ajax_generate_content() {
        check_ajax_referer('abaek_nonce', 'nonce');
        
        // 프론트엔드에서 Puter.js로 처리
        wp_send_json_success(['message' => 'Use Puter.js on client-side']);
    }
    
    public function ajax_upload_thumbnail() {
        check_ajax_referer('abaek_nonce', 'nonce');
        
        if (!isset($_FILES['thumbnail'])) {
            wp_send_json_error('No thumbnail file');
        }
        
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        $file = $_FILES['thumbnail'];
        $upload = wp_handle_upload($file, ['test_form' => false]);
        
        if (isset($upload['error'])) {
            wp_send_json_error($upload['error']);
        }
        
        $attachment = [
            'post_mime_type' => $upload['type'],
            'post_title' => 'AI Generated Thumbnail',
            'post_content' => '',
            'post_status' => 'inherit'
        ];
        
        $attach_id = wp_insert_attachment($attachment, $upload['file']);
        $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
        wp_update_attachment_metadata($attach_id, $attach_data);
        
        wp_send_json_success([
            'id' => $attach_id,
            'url' => wp_get_attachment_url($attach_id),
            'size' => round(filesize($upload['file']) / 1024, 2)
        ]);
    }
    
    public function ajax_create_post() {
        check_ajax_referer('abaek_nonce', 'nonce');
        
        $title = sanitize_text_field($_POST['title']);
        $content = wp_kses_post($_POST['content']);
        $category = intval($_POST['category']);
        $thumbnail_id = intval($_POST['thumbnail_id']);
        
        $post_data = [
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'draft',
            'post_type' => 'post',
        ];
        
        if ($category > 0) {
            $post_data['post_category'] = [$category];
        }
        
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            wp_send_json_error($post_id->get_error_message());
        }
        
        if ($thumbnail_id > 0) {
            set_post_thumbnail($post_id, $thumbnail_id);
        }
        
        // 통계 업데이트
        $this->update_stats($content);
        
        wp_send_json_success([
            'post_id' => $post_id,
            'edit_url' => get_edit_post_link($post_id, 'raw'),
            'view_url' => get_permalink($post_id)
        ]);
    }
    
    private function update_stats($content) {
        $stats = get_option('abaek_stats', [
            'posts' => 0,
            'chars' => 0,
            'thumbs' => 0
        ]);
        
        $stats['posts']++;
        $stats['chars'] += mb_strlen(strip_tags($content));
        
        update_option('abaek_stats', $stats);
    }
    
    public function ajax_get_stats() {
        check_ajax_referer('abaek_nonce', 'nonce');
        
        $stats = get_option('abaek_stats', [
            'posts' => 0,
            'chars' => 0,
            'thumbs' => 0
        ]);
        
        wp_send_json_success($stats);
    }
}

// Initialize plugin
AI_Abaek_Posting::get_instance();

// Create assets directory structure on activation
register_activation_hook(__FILE__, 'abaek_activate');
function abaek_activate() {
    $upload_dir = wp_upload_dir();
    $abaek_dir = $upload_dir['basedir'] . '/abaek-ai';
    
    if (!file_exists($abaek_dir)) {
        wp_mkdir_p($abaek_dir);
    }
    
    // Create CSS file
    $css_content = file_get_contents(dirname(__FILE__) . '/assets/admin.css');
    if ($css_content === false) {
        // CSS will be created separately
    }
    
    // Create JS file
    $js_content = file_get_contents(dirname(__FILE__) . '/assets/admin.js');
    if ($js_content === false) {
        // JS will be created separately
    }
}
