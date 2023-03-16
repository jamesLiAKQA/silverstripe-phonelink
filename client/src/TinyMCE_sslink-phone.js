/* global tinymce, window */
import i18n from 'i18n';
import TinyMCEActionRegistrar from 'lib/TinyMCEActionRegistrar';
import React from 'react';
import ReactDOM from 'react-dom';
import jQuery from 'jquery';
import {createInsertLinkModal} from 'containers/InsertLinkModal/InsertLinkModal';
import {loadComponent} from 'lib/Injector';
import 'lang/en.js';
import 'lang/fr.js';

const commandNamePhone = 'sslinkphone';
const commandNameSMS = 'sslinksms';

// Link to phone number
TinyMCEActionRegistrar
    .addAction('sslink', {
        text: i18n._t('Admin.LINKLABEL_PHONE', 'Link to phone number'),
        // eslint-disable-next-line no-console
        onclick: (editor) => editor.execCommand(commandNamePhone),
        priority: 51,
    })
    .addCommandWithUrlTest(commandNamePhone, /^tel:/);

TinyMCEActionRegistrar
    .addAction('sslink', {
        text: i18n._t('Admin.LINKLABEL_SMS', 'Link to phone number'),
        // eslint-disable-next-line no-console
        onclick: (editor) => editor.execCommand(commandNameSMS),
        priority: 51,
    })
    .addCommandWithUrlTest(commandNameSMS, /^sms:/);

const plugin = {
    init(editor) {
        editor.addCommand(commandName, () => {
            const field = window.jQuery(`#${editor.id}`).entwine('ss');

            field.openLinkPhoneDialog('phone');
        });
        editor.addCommand(commandNameSMS, () => {
            const field = window.jQuery(`#${editor.id}`).entwine('ss');

            field.openLinkPhoneDialog('sms');
        });
    },
};

const modalId = 'insert-link__dialog-wrapper--phone';
const sectionConfigKey = 'SilverStripe\\Admin\\LeftAndMain';
const formName = 'EditorPhoneLink';

const InsertLinkPhoneModal = loadComponent(createInsertLinkModal(sectionConfigKey, formName));

jQuery.entwine('ss', ($) => {
    $('textarea.htmleditor').entwine({
        openLinkPhoneDialog(type) {
            let dialog = $(`#${modalId}`);

            dialog.type = type;

            if (!dialog.length) {
                dialog = $(`<div id="${modalId}" />`);
                $('body').append(dialog);
            }
            dialog.addClass('insert-link__dialog-wrapper');

            dialog.setElement(this);
            dialog.open();
        },
    });

    /**
     * Assumes that $('.insert-link__dialog-wrapper').entwine({}); is defined for shared functions
     */
    $(`#${modalId}`).entwine({
        renderModal(isOpen) {
            const handleHide = () => this.close();
            const handleInsert = (...args) => this.handleInsert(...args);
            const attrs = this.getOriginalAttributes();
            const selection = tinymce.activeEditor.selection;
            const selectionContent = selection.getContent() || '';
            const tagName = selection.getNode().tagName;
            const requireLinkText = tagName !== 'A' && selectionContent.trim() === '';

            // create/update the react component
            ReactDOM.render(
                <InsertLinkPhoneModal
                isOpen={isOpen}
                onInsert={handleInsert}
                onClosed={handleHide}
                title={i18n._t('Admin.LINK_PHONE', 'Insert phone number link')}
                bodyClassName="modal__dialog"
                className="insert-link__dialog-wrapper--phone"
                fileAttributes={attrs}
                identifier="Admin.InsertLinkPhoneModal"
                requireLinkText={requireLinkText}
                />,
                this[0]
            );

        },

        getOriginalAttributes() {
            const editor = this.getElement().getEditor();
            const node = $(editor.getSelectedNode());

            let phone = (node.attr('href') || '').replace(/^tel:/, '').replace(/^sms:/, '');

            return {
                Link: phone,
                Description: node.attr('title'),
            };
        },

        buildAttributes(data) {
            const attributes = this._super(data);

            let href = '';

            let phone = attributes.href.replace(/^tel:/, '').replace(/^sms:/, '');

            if (phone) {
                href = `tel:${phone}`;
                console.log('in phone'+this.type);
            }
            attributes.href = href;

            delete attributes.target;

            return attributes;
        },
    });
});

// Adds the plugin class to the list of available TinyMCE plugins
tinymce.PluginManager.add(commandNamePhone, (editor) => plugin.init(editor));

export default plugin;
