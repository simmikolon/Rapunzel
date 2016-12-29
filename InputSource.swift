//
//  InputSource.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

enum ControlInputDirection: Int {
    case up = 0, down, left, right
    
    init?(vector: float2) {
        // Require sufficient displacement to specify direction.
        guard length(vector) >= 0.5 else { return nil }
        
        // Take the max displacement as the specified axis.
        if abs(vector.x) > abs(vector.y) {
            self = vector.x > 0 ? .right : .left
        }
        else {
            self = vector.y > 0 ? .up : .down
        }
    }
}

protocol InputSourceGameStateDelegate: class {
    func inputSourceDidTogglePauseState(_ controlInputSource: InputSource)
    func inputSourceDidToggleResumeState(_ controlInputSource: InputSource)
    func inputSourceDidSelect(_ controlInputSource: InputSource)
    func inputSource(_ controlInputSource: InputSource, didSpecifyDirection: ControlInputDirection)
}

protocol InputSourceDelegate: class {
    func inputSourceDidBeginUsingSpecialPower(_ inputSource: InputSource)
    func inputSourceDidEndUsingSpecialPower(_ inputSource: InputSource)
    func inputSourceDidBeginAttack(_ inputSource: InputSource)
    func inputSourceDidEndAttack(_ inputSource: InputSource)
    func inputSource(_ inputSource: InputSource, didUpdateDisplacement: float2)
}

protocol InputSource: class {
    weak var gameStateDelegate: InputSourceGameStateDelegate? { get set }
    weak var delegate: InputSourceDelegate? { get set }
    func resetControlState()
}
