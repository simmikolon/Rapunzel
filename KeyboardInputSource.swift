//
//  KeyboardInputSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class KeyboardInputSource: InputSource, RampDelegate {
    
    private var downKeys = Set<Character>()
    private var currentDisplacement = float2()
    
    private static let rightVector = float2(x: 0.225, y: 0)
    private static let leftVector = float2(x: -0.225, y: 0)
    
    private lazy var ramp: Ramp = {
        let ramp = Ramp()
        ramp.delegate = self
        return ramp
    }()
    
    /// `ControlInputSourceType` delegates.
    weak var gameStateDelegate: InputSourceGameStateDelegate?
    weak var delegate: InputSourceDelegate?
    
    private let mapping: [Character: float2] = [
        
        /* TODO: Put Mapping into Datasource or read out of game settings to user define mapping */
        
        /* Left arrow */
        
        Character(UnicodeScalar(0xF702)):   KeyboardInputSource.leftVector,
        "a":                                KeyboardInputSource.leftVector,
        
        /* Right arrow */
        
        Character(UnicodeScalar(0xF703)):   KeyboardInputSource.rightVector,
        "d":                                KeyboardInputSource.rightVector
    ]
    
    func handleKeyDownForCharacter(character: Character) {
        
        /* Handle only keys that have not been pressed and add them to the downKeys set */
        
        if downKeys.contains(character) { return }
        downKeys.insert(character)
        
        /* Check for Special Power Key */
        
        if let displacement = relativeDisplacementForCharacter(character) {
            currentDisplacement = displacement
            ramp.rampUp()
        }
        
        else if isSpecialPowerCharacter(character) {
            delegate?.inputSourceDidBeginUsingSpecialPower(self)
        }
        
        else if isPauseCharacter(character) {
            gameStateDelegate?.inputSourceDidTogglePauseState(self)
        }
        
        else if isResumeCharacter(character) {
            gameStateDelegate?.inputSourceDidToggleResumeState(self)
        }
    }
    
    func handleKeyUpForCharacter(character: Character) {
        
        /* Handle only that keys that have previously been added to the set thus been pressed */
        
        guard downKeys.remove(character) != nil else { return }
        
        /* Check for Special Power Key */
        
        if let displacement = relativeDisplacementForCharacter(character) {
            currentDisplacement = displacement
            ramp.rampDown()
        }
        
        else if isSpecialPowerCharacter(character) {
            delegate?.inputSourceDidEndUsingSpecialPower(self)
        }
    }
    
    private func isSpecialPowerCharacter(character: Character) -> Bool {
        
        /* TODO: Add this to a datasource so we can dynamically generate keyboard character patterns */
        /*       Or Safe this in the Game Settings so user can define keys themselves */
        
        return ["f", " ", "\r"].contains(character)
    }
    
    private func isPauseCharacter(character: Character) -> Bool {
        
        /* TODO: Add this to a datasource so we can dynamically generate keyboard character patterns */
        /*       Or Safe this in the Game Settings so user can define keys themselves */
        
        return ["p"].contains(character)
    }
    
    private func isResumeCharacter(character: Character) -> Bool {
        
        /* TODO: Add this to a datasource so we can dynamically generate keyboard character patterns */
        /*       Or Safe this in the Game Settings so user can define keys themselves */
        
        return ["r"].contains(character)
    }
    
    private func relativeDisplacementForCharacter(character: Character) -> float2? {
        return mapping[character]
    }
    
    func ramp(ramp: Ramp, didChangeRampFactor rampFactor: Float) {
        var rampedDisplacement = currentDisplacement
        rampedDisplacement.x *= rampFactor
        delegate?.inputSource(self, didUpdateDisplacement: rampedDisplacement)
    }
}
