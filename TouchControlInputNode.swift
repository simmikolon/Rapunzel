/*
    Copyright (C) 2015 Apple Inc. All Rights Reserved.
    See LICENSE.txt for this sample’s licensing information
    
    Abstract:
    An implementation of the `ControlInputSourceType` protocol that enables support for touch-based thumbsticks on iOS.
*/

import SpriteKit
import CoreMotion

struct MotionInputSourceSettings {
    
    static let AccelerometerUpdateInterval = 0.1
}

class TouchControlInputNode: SKSpriteNode, InputSource {
    
    // MARK: - Properties
    
    weak var gameStateDelegate: InputSourceGameStateDelegate?
    weak var delegate: InputSourceDelegate?
    
    let motionManager = CMMotionManager()
    var leftControlTouches = Set<UITouch>()
    var rightControlTouches = Set<UITouch>()
    
    var lastSide = 0
    
    lazy var pauseButton: SKSpriteNode = {
        let buttonSize = CGSize(width: self.frame.height / 4, height: self.frame.height / 4)
        let pauseButton = SKSpriteNode(color: SKColor.white, size: buttonSize)
        pauseButton.position = CGPoint(x: 100, y: 1200)
        return pauseButton
    }()
    
    let centerDividerWidth: CGFloat

    // MARK: - Initialization
    
    init(frame: CGRect, thumbStickNodeSize: CGSize) {
        
        centerDividerWidth = frame.width / 4.5
        
        super.init(texture: nil, color: UIColor.clear, size: frame.size)

        //addChild(pauseButton)
        
        isUserInteractionEnabled = true
        
        startMotionUpdates()
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Core Motion
    
    func startMotionUpdates() {
        
        motionManager.accelerometerUpdateInterval = MotionInputSourceSettings.AccelerometerUpdateInterval
        
        motionManager.startAccelerometerUpdates(to: OperationQueue.current!, withHandler: {
            (accelerometerData: CMAccelerometerData?, error: Error?) in
            
            if let accelerometerData = accelerometerData {
                
                let displacement = float2(Float(accelerometerData.acceleration.x), Float(accelerometerData.acceleration.y))
                self.delegate?.inputSource(self, didUpdateDisplacement: displacement)
            }
        })
    }

    // MARK: - ControlInputSourceType
    
    func resetControlState() {
        // Nothing to do here.
    }
    
    // MARK: - UIResponder
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        //delegate?.inputSourceDidBeginUsingSpecialPower(self)
        for touch in touches {
            let touchPoint = touch.location(in: self)
            
            /*
             Ignore touches if the thumb stick controls are hidden, or if
             the touch is in the center of the screen.
             */
            
            let touchIsInCenter = touchPoint.x < centerDividerWidth / 2 && touchPoint.x > -centerDividerWidth / 2
            
            if touchIsInCenter {
                continue
            }
            
            if touchPoint.x < 0 {
                leftControlTouches.formUnion([touch])
                delegate?.inputSourceDidBeginUsingSpecialPower(self)
            }
            else {
                rightControlTouches.formUnion([touch])
                gameStateDelegate?.inputSourceDidTogglePauseState(self)
            }
        }
    }
    
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesMoved(touches, with: event)
    }
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesEnded(touches, with: event)
        delegate?.inputSourceDidEndUsingSpecialPower(self)
        for touch in touches {
            let touchPoint = touch.location(in: self)
            
            /// Toggle pause when touching in the pause node.
            if pauseButton === atPoint(touchPoint) {
                gameStateDelegate?.inputSourceDidTogglePauseState(self)
                break
            }
        }
        
        let endedLeftTouches = touches.intersection(leftControlTouches)
        leftControlTouches.subtract(endedLeftTouches)
        
        let endedRightTouches = touches.intersection(rightControlTouches)
        rightControlTouches.subtract(endedRightTouches)
    }
    
    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesCancelled(touches, with: event)
        
        // Keep the set's capacity, because roughly the same number of touch events are being received.
        leftControlTouches.removeAll(keepingCapacity: true)
        rightControlTouches.removeAll(keepingCapacity: true)
    }
}
