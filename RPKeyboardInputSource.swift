//
//  RPKeyboardInputSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPKeyboardInputSource: RPInputSource, RPRampDelegate {
    
    var downKeys = Set<Character>()
    var currentDisplacement = float2()
    
    static let rightVector = float2(x: 0.225, y: 0)
    static let leftVector = float2(x: -0.225, y: 0)
    
    lazy var ramp: RPRamp = {
        let ramp = RPRamp()
        ramp.delegate = self
        return ramp
    }()
    
    private let mapping: [Character: float2] = [
        
        /* TODO: Put Mapping into Datasource or read out of game settings to user define mapping */
        
        // Left arrow.
        Character(UnicodeScalar(0xF702)):   RPKeyboardInputSource.leftVector,
        "a":                                RPKeyboardInputSource.leftVector,
        
        // Right arrow.
        Character(UnicodeScalar(0xF703)):   RPKeyboardInputSource.rightVector,
        "d":                                RPKeyboardInputSource.rightVector
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
    
    private func relativeDisplacementForCharacter(character: Character) -> float2? {
        
        return mapping[character]
    }
    
    func ramp(ramp: RPRamp, didChangeRampFactor rampFactor: Float) {
        
        var rampedDisplacement = currentDisplacement
        rampedDisplacement.x *= rampFactor
        delegate?.inputSource(self, didUpdateDisplacement: rampedDisplacement)
    }
}
