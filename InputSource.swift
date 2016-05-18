//
//  InputSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

/// Delegate methods for responding to control input that applies to the game as a whole.
protocol InputSourceGameStateDelegate: class {
    func inputSourceDidTogglePauseState(controlInputSource: InputSource)
    func inputSourceDidToggleResumeState(controlInputSource: InputSource)
}

protocol InputSourceDelegate: class {
    
    func inputSourceDidBeginUsingSpecialPower(inputSource: InputSource)
    func inputSourceDidEndUsingSpecialPower(inputSource: InputSource)
    
    func inputSourceDidBeginAttack(inputSource: InputSource)
    func inputSourceDidEndAttack(inputSource: InputSource)
    
    func inputSource(inputSource: InputSource, didUpdateDisplacement: float2)
}

protocol InputSource: class {
    
    weak var gameStateDelegate: InputSourceGameStateDelegate? { get set }
    weak var delegate: InputSourceDelegate? { get set }
}
